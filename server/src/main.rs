mod config;
mod error;
mod middleware;
mod models;
mod routes;

use actix_cors::Cors;
use actix_governor::{Governor, GovernorConfigBuilder};
use actix_session::{SessionMiddleware, storage::CookieSessionStore};
use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_web::cookie::Key;
use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::EnvFilter;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let cfg = config::Config::from_env();

    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&cfg.database_url)
        .await
        .expect("Failed to connect to database");

    run_migrations(&pool).await;

    let secret_key = Key::derive_from(cfg.session_secret.as_bytes());

    let governor_conf = GovernorConfigBuilder::default()
        .seconds_per_request(1)
        .burst_size(10)
        .finish()
        .unwrap();

    let auth_governor_conf = GovernorConfigBuilder::default()
        .seconds_per_request(5)
        .burst_size(5)
        .finish()
        .unwrap();

    tracing::info!("Starting server on port {}", cfg.port);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:4200")
            .allowed_origin("http://127.0.0.1:4200")
            .allowed_methods(vec!["GET", "POST"])
            .allowed_headers(vec![
                actix_web::http::header::CONTENT_TYPE,
                actix_web::http::header::AUTHORIZATION,
            ])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .wrap(
                SessionMiddleware::builder(
                    CookieSessionStore::default(),
                    secret_key.clone(),
                )
                .cookie_name("tetris.sid".into())
                .cookie_same_site(actix_web::cookie::SameSite::Lax)
                .cookie_http_only(true)
                .cookie_secure(false)
                .build(),
            )
            .app_data(web::Data::new(pool.clone()))
            .service(
                web::scope("/api")
                    .route("/health", web::get().to(health))
                    .service(
                        web::scope("/auth")
                            .wrap(Governor::new(&auth_governor_conf))
                            .route("/register", web::post().to(routes::auth::register))
                            .route("/login", web::post().to(routes::auth::login))
                            .route("/logout", web::post().to(routes::auth::logout))
                            .route("/me", web::get().to(routes::auth::me)),
                    )
                    .service(
                        web::scope("/scores")
                            .wrap(Governor::new(&governor_conf))
                            .route("", web::post().to(routes::scores::submit_score))
                            .route("/leaderboard", web::get().to(routes::scores::leaderboard))
                            .route("/personal", web::get().to(routes::scores::personal_scores))
                            .route("/rank", web::get().to(routes::scores::user_rank)),
                    )
                    .route("/self-destruct", web::post().to(routes::self_destruct::self_destruct))
            )
    })
    .bind(("0.0.0.0", cfg.port))?
    .run()
    .await
}

async fn health() -> actix_web::HttpResponse {
    actix_web::HttpResponse::Ok().json(serde_json::json!({ "ok": true }))
}

async fn run_migrations(pool: &sqlx::PgPool) {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(30) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )",
    )
    .execute(pool)
    .await
    .expect("Failed to create users table");

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS scores (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            score INTEGER NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            lines INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        )",
    )
    .execute(pool)
    .await
    .expect("Failed to create scores table");

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)")
        .execute(pool)
        .await
        .ok();
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id)")
        .execute(pool)
        .await
        .ok();

    tracing::info!("Database tables ready");
}
