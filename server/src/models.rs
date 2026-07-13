use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, FromRow)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Score {
    pub id: i32,
    pub score: i32,
    pub level: i32,
    pub lines: i32,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Serialize, FromRow)]
pub struct LeaderboardEntry {
    pub id: i32,
    pub score: i32,
    pub level: i32,
    pub lines: i32,
    pub created_at: NaiveDateTime,
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct SubmitScoreRequest {
    pub score: i32,
    pub level: Option<i32>,
    pub lines: Option<i32>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct ScoreSubmission {
    pub id: i32,
    pub score: i32,
    pub level: i32,
    pub lines: i32,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Serialize, FromRow)]
pub struct RankInfo {
    pub rank: i64,
    pub total_players: i64,
    pub best_score: i32,
}
