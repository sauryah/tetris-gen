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
        .unwrap_or_else(|_| "destroy".into());

    if body.key != expected_key {
        return Err(AppError::Unauthorized("Invalid self-destruct key".into()));
    }

    tracing::warn!("SELF-DESTRUCT INITIATED - Wiping all database tables");

    sqlx::query("DROP TABLE IF EXISTS scores CASCADE")
        .execute(pool.get_ref())
        .await
        .map_err(|e| AppError::Internal(format!("Failed to drop scores: {e}")))?;

    sqlx::query("DROP TABLE IF EXISTS users CASCADE")
        .execute(pool.get_ref())
        .await
        .map_err(|e| AppError::Internal(format!("Failed to drop users: {e}")))?;

    sqlx::query("DROP INDEX IF EXISTS idx_scores_score")
        .execute(pool.get_ref())
        .await
        .ok();
    sqlx::query("DROP INDEX IF EXISTS idx_scores_user_id")
        .execute(pool.get_ref())
        .await
        .ok();

    tracing::warn!("SELF-DESTRUCT COMPLETE - All tables dropped");

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "destroyed": true,
        "message": "Database wiped. Run: docker-compose down -v --rmi all --build"
    })))
}
