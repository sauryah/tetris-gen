use actix_session::Session;

use crate::error::AppError;

pub fn get_user_id(session: &Session) -> Result<i32, AppError> {
    session
        .get::<i32>("user_id")
        .map_err(|_| AppError::Internal("Session error".into()))?
        .ok_or_else(|| AppError::Unauthorized("Not logged in".into()))
}
