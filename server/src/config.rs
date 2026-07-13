pub struct Config {
    pub database_url: String,
    pub session_secret: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://tetris:tetris123@db:5432/tetris".into()),
            session_secret: std::env::var("SESSION_SECRET")
                .unwrap_or_else(|_| "tetris-gen-secret-change-in-prod".into()),
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "3000".into())
                .parse()
                .unwrap_or(3000),
        }
    }
}
