use actix_web::{web, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;

use crate::error::AppError;

#[derive(Debug, Deserialize)]
pub struct SelfDestructRequest {
    pub key: String,
}

pub async fn self_destruct(
    body: web::Json<SelfDestructRequest>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, AppError> {
    let expected_key = std::env::var("SELF_DESTRUCT_KEY")
        .map_err(|_| AppError::Internal("SELF_DESTRUCT_KEY not configured".into()))?;

    if body.key != expected_key {
        return Err(AppError::Unauthorized("Invalid self-destruct key".into()));
    }

    tracing::warn!("SELF-DESTRUCT INITIATED - Wiping all database tables");

    sqlx::query("DROP TABLE IF EXISTS scores CASCADE")
        .execute(pool.get_ref())
        .await
        .map_err(|_| AppError::Internal("Failed to drop scores table".into()))?;

    sqlx::query("DROP TABLE IF EXISTS users CASCADE")
        .execute(pool.get_ref())
        .await
        .map_err(|_| AppError::Internal("Failed to drop users table".into()))?;

    tracing::warn!("SELF-DESTRUCT COMPLETE - All tables dropped");

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "destroyed": true,
        "message": "Database wiped. Run: docker-compose down -v --rmi all --build"
    })))
}
