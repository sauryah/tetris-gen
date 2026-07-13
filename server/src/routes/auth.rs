use actix_session::Session;
use actix_web::{web, HttpResponse};
use argon2::password_hash::SaltString;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use rand::rngs::OsRng;
use serde_json::json;
use sqlx::PgPool;

use crate::error::AppError;
use crate::models::{LoginRequest, RegisterRequest, User};

pub async fn register(
    body: web::Json<RegisterRequest>,
    pool: web::Data<PgPool>,
    session: Session,
) -> Result<HttpResponse, AppError> {
    let username = body.username.trim().to_string();
    let password = &body.password;

    if username.len() < 2 || username.len() > 20 {
        return Err(AppError::BadRequest("Username must be 2-20 characters".into()));
    }
    if !username.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err(AppError::BadRequest("Username can only contain letters, numbers, and underscores".into()));
    }
    if password.len() < 4 {
        return Err(AppError::BadRequest("Password must be at least 4 characters".into()));
    }

    let existing = sqlx::query_scalar::<_, i32>("SELECT id FROM users WHERE username = $1")
        .bind(&username)
        .fetch_optional(pool.get_ref())
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    if existing.is_some() {
        return Err(AppError::Conflict("Username already taken".into()));
    }

    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| AppError::Internal(e.to_string()))?
        .to_string();

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at",
    )
    .bind(&username)
    .bind(&hash)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?;

    session.insert("user_id", user.id)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(HttpResponse::Ok().json(json!({ "user": user })))
}

pub async fn login(
    body: web::Json<LoginRequest>,
    pool: web::Data<PgPool>,
    session: Session,
) -> Result<HttpResponse, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, created_at FROM users WHERE username = $1",
    )
    .bind(&body.username)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
    .ok_or_else(|| AppError::Unauthorized("Invalid username or password".into()))?;

    let row = sqlx::query_scalar::<_, String>("SELECT password_hash FROM users WHERE id = $1")
        .bind(user.id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let parsed = PasswordHash::new(&row)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed)
        .map_err(|_| AppError::Unauthorized("Invalid username or password".into()))?;

    session.insert("user_id", user.id)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(HttpResponse::Ok().json(json!({ "user": user })))
}

pub async fn logout(session: Session) -> Result<HttpResponse, AppError> {
    session.purge();
    Ok(HttpResponse::Ok().json(json!({ "ok": true })))
}

pub async fn me(
    pool: web::Data<PgPool>,
    session: Session,
) -> Result<HttpResponse, AppError> {
    let user_id = match session.get::<i32>("user_id") {
        Ok(Some(id)) => id,
        _ => return Ok(HttpResponse::Ok().json(json!({ "user": null }))),
    };

    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, created_at FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?;

    match user {
        Some(u) => Ok(HttpResponse::Ok().json(json!({ "user": u }))),
        None => Ok(HttpResponse::Ok().json(json!({ "user": null }))),
    }
}
