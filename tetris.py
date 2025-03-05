import pygame
import random

# Initialize pygame
pygame.init()

# Game Constants
WIDTH, HEIGHT = 300, 600
GRID_SIZE = 30
COLUMNS, ROWS = WIDTH // GRID_SIZE, HEIGHT // GRID_SIZE
FPS = 30

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (200, 0, 0)
GREEN = (0, 200, 0)
BLUE = (0, 0, 200)
COLORS = [RED, GREEN, BLUE]

# Tetrimino Shapes
SHAPES = [
    [[1, 1, 1, 1]],  # I shape
    [[1, 1], [1, 1]],  # O shape
    [[0, 1, 1], [1, 1, 0]],  # S shape
    [[1, 1, 0], [0, 1, 1]],  # Z shape
    [[1, 0, 0], [1, 1, 1]],  # L shape
    [[0, 0, 1], [1, 1, 1]],  # J shape
    [[0, 1, 0], [1, 1, 1]]  # T shape
]

class Piece:
    def __init__(self):
        self.shape = random.choice(SHAPES)
        self.color = random.choice(COLORS)
        self.x, self.y = COLUMNS // 2 - len(self.shape[0]) // 2, 0

    def rotate(self):
        self.shape = [list(row) for row in zip(*self.shape[::-1])]

class Tetris:
    def __init__(self):
        self.grid = [[BLACK for _ in range(COLUMNS)] for _ in range(ROWS)]
        self.current_piece = Piece()
        self.running = True
        self.score = 0

    def is_valid_move(self, dx=0, dy=0, rotated=False):
        shape = self.current_piece.shape if not rotated else [list(row) for row in zip(*self.current_piece.shape[::-1])]
        for row_idx, row in enumerate(shape):
            for col_idx, cell in enumerate(row):
                if cell:
                    x, y = self.current_piece.x + col_idx + dx, self.current_piece.y + row_idx + dy
                    if x < 0 or x >= COLUMNS or y >= ROWS or (y >= 0 and self.grid[y][x] != BLACK):
                        return False
        return True

    def place_piece(self):
        for row_idx, row in enumerate(self.current_piece.shape):
            for col_idx, cell in enumerate(row):
                if cell:
                    self.grid[self.current_piece.y + row_idx][self.current_piece.x + col_idx] = self.current_piece.color
        self.clear_lines()
        self.current_piece = Piece()
        if not self.is_valid_move():
            self.running = False  # Game Over

    def clear_lines(self):
        new_grid = [row for row in self.grid if BLACK in row]
        cleared = ROWS - len(new_grid)
        self.score += cleared * 100
        self.grid = [[BLACK] * COLUMNS for _ in range(cleared)] + new_grid

    def move_piece(self, dx, dy):
        if self.is_valid_move(dx, dy):
            self.current_piece.x += dx
            self.current_piece.y += dy
        elif dy:  # If moving down is not possible, place the piece
            self.place_piece()

    def rotate_piece(self):
        if self.is_valid_move(rotated=True):
            self.current_piece.rotate()

    def draw(self, screen):
        screen.fill(BLACK)
        for y, row in enumerate(self.grid):
            for x, color in enumerate(row):
                if color != BLACK:
                    pygame.draw.rect(screen, color, (x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE))
        for row_idx, row in enumerate(self.current_piece.shape):
            for col_idx, cell in enumerate(row):
                if cell:
                    pygame.draw.rect(screen, self.current_piece.color,
                                     ((self.current_piece.x + col_idx) * GRID_SIZE, 
                                      (self.current_piece.y + row_idx) * GRID_SIZE, GRID_SIZE, GRID_SIZE))
        pygame.display.flip()

# Main game loop
def main():
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    clock = pygame.time.Clock()
    game = Tetris()

    while game.running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                game.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    game.move_piece(-1, 0)
                elif event.key == pygame.K_RIGHT:
                    game.move_piece(1, 0)
                elif event.key == pygame.K_DOWN:
                    game.move_piece(0, 1)
                elif event.key == pygame.K_UP:
                    game.rotate_piece()
        
        game.move_piece(0, 1)  # Auto drop
        game.draw(screen)
        clock.tick(FPS)
    
    pygame.quit()

if __name__ == "__main__":
    main()
