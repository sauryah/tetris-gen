use actix_session::Session;
use actix_web::{web, HttpResponse};
use serde_json::json;
use sqlx::PgPool;

use crate::error::AppError;
use crate::middleware::get_user_id;
use crate::models::{LeaderboardEntry, RankInfo, Score, ScoreSubmission, SubmitScoreRequest};

pub async fn submit_score(
    body: web::Json<SubmitScoreRequest>,
    pool: web::Data<PgPool>,
    session: Session,
) -> Result<HttpResponse, AppError> {
    let user_id = get_user_id(&session)?;

    if body.score < 0 {
        return Err(AppError::BadRequest("Invalid score".into()));
    }

    let level = body.level.unwrap_or(1);
    let lines = body.lines.unwrap_or(0);

    let submission = sqlx::query_as::<_, ScoreSubmission>(
        "INSERT INTO scores (user_id, score, level, lines) VALUES ($1, $2, $3, $4) RETURNING id, score, level, lines, created_at",
    )
    .bind(user_id)
    .bind(body.score)
    .bind(level)
    .bind(lines)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?;

    let rank = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) + 1 FROM scores WHERE score > $1",
    )
    .bind(body.score)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(HttpResponse::Ok().json(json!({
        "submission": submission,
        "rank": rank,
    })))
}

pub async fn leaderboard(
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, AppError> {
    let entries = sqlx::query_as::<_, LeaderboardEntry>(
        "SELECT s.id, s.score, s.level, s.lines, s.created_at, u.username
         FROM scores s JOIN users u ON s.user_id = u.id
         ORDER BY s.score DESC LIMIT 10",
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(HttpResponse::Ok().json(json!({ "leaderboard": entries })))
}

pub async fn personal_scores(
    pool: web::Data<PgPool>,
    session: Session,
) -> Result<HttpResponse, AppError> {
    let user_id = get_user_id(&session)?;

    let scores = sqlx::query_as::<_, Score>(
        "SELECT id, score, level, lines, created_at
         FROM scores WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 20",
    )
    .bind(user_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(HttpResponse::Ok().json(json!({ "scores": scores })))
}

pub async fn user_rank(
    pool: web::Data<PgPool>,
    session: Session,
) -> Result<HttpResponse, AppError> {
    let user_id = get_user_id(&session)?;

    let info = sqlx::query_as::<_, RankInfo>(
        "SELECT
            (SELECT COUNT(*) + 1 FROM scores WHERE score > (SELECT COALESCE(MAX(score), 0) FROM scores WHERE user_id = $1)) AS rank,
            (SELECT COUNT(*) FROM scores) AS total_players,
            (SELECT COALESCE(MAX(score), 0) FROM scores WHERE user_id = $1) AS best_score",
    )
    .bind(user_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(HttpResponse::Ok().json(info))
}
