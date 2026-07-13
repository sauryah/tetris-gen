pub struct Config {
    pub database_url: String,
    pub session_secret: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        let session_secret = std::env::var("SESSION_SECRET")
            .expect("SESSION_SECRET env var must be set (min 32 chars)");

        if session_secret.len() < 32 {
            panic!("SESSION_SECRET must be at least 32 characters");
        }

        Self {
            database_url: std::env::var("DATABASE_URL")
                .expect("DATABASE_URL env var must be set"),
            session_secret,
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "3000".into())
                .parse()
                .unwrap_or(3000),
        }
    }
}
