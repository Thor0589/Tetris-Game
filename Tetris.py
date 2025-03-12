import pygame # type: ignore
import random
import os
import math
import traceback

# Initialize Pygame
pygame.init()

# Screen dimensions
s_width = 800
s_height = 700
play_width = 300
play_height = 600
block_size = 30

# Top-left coordinates of the play area
top_left_x = (s_width - play_width) // 2
top_left_y = s_height - play_height - 50

# Colors and UI constants
BACKGROUND_COLOR = (40, 44, 52)
GRID_COLOR = (70, 74, 82)
UI_BORDER_COLOR = (60, 64, 72)

# Particle system for visual effects
class ParticleEffect:
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.color = color
        self.lifetime = 20
        self.dx = random.uniform(-4, 4)
        self.dy = random.uniform(-6, -2)
        self.size = random.uniform(2, 5)
        self.spin = random.uniform(-0.2, 0.2)
        self.shape_type = random.choice(['circle', 'square', 'star'])

    def update(self):
        self.x += self.dx
        self.y += self.dy
        self.dy += 0.3  # Enhanced gravity
        self.size *= 0.93  # Faster shrink
        self.lifetime -= 1
        return self.lifetime > 0

    def draw(self, surface):
        alpha = int(255 * (self.lifetime / 20))
        color = (*self.color[:3], alpha)
        
        if self.shape_type == 'circle':
            pygame.draw.circle(surface, color, (int(self.x), int(self.y)), int(self.size))
        elif self.shape_type == 'square':
            size = int(self.size)
            rect = pygame.Rect(int(self.x - size/2), int(self.y - size/2), size, size)
            pygame.draw.rect(surface, color, rect)
        else:  # star
            points = []
            for i in range(5):
                angle = i * (2 * math.pi / 5) + self.spin
                points.append((
                    self.x + math.cos(angle) * self.size,
                    self.y + math.sin(angle) * self.size
                ))
            if len(points) >= 3:  # Ensure we have enough points for a polygon
                pygame.draw.polygon(surface, color, points)

class VisualEffects:
    def __init__(self):
        self.particles = []
        self.time = 0
        self.glow_strength = 0
    
    def update(self):
        self.time += 1
        self.particles = [p for p in self.particles if p.update()]
        self.glow_strength = math.sin(self.time * 0.1) * 0.3 + 0.7
    
    def add_landing_effect(self, x, y, color):
        for _ in range(20):
            self.particles.append(ParticleEffect(x, y, color))
    
    def draw(self, surface):
        for particle in self.particles:
            particle.draw(surface)

effects = VisualEffects()

# Shape definitions
S = [['.....',
      '.....',
      '..00.',
      '.00..',
      '.....'],
     ['.....',
      '..0..',
      '..00.',
      '...0.',
      '.....']]

Z = [['.....',
      '.....',
      '.00..',
      '..00.',
      '.....'],
     ['.....',
      '..0..',
      '.00..',
      '.0...',
      '.....']]

I = [['.....',
      '..0..',
      '..0..',
      '..0..',
      '..0..'],
     ['.....',
      '0000.',
      '.....',
      '.....',
      '.....']]

O = [['.....',
      '.....',
      '.00..',
      '.00..',
      '.....']]

J = [['.....',
      '.0...',
      '.000.',
      '.....',
      '.....'],
     ['.....',
      '..00.',
      '..0..',
      '..0..',
      '.....'],
     ['.....',
      '.....',
      '.000.',
      '...0.',
      '.....'],
     ['.....',
      '..0..',
      '..0..',
      '.00..',
      '.....']]

L = [['.....',
      '...0.',
      '.000.',
      '.....',
      '.....'],
     ['.....',
      '..0..',
      '..0..',
      '..00.',
      '.....'],
     ['.....',
      '.....',
      '.000.',
      '.0...',
      '.....'],
     ['.....',
      '.00..',
      '..0..',
      '..0..',
      '.....']]

T = [['.....',
      '..0..',
      '.000.',
      '.....',
      '.....'],
     ['.....',
      '..0..',
      '..00.',
      '..0..',
      '.....'],
     ['.....',
      '.....',
      '.000.',
      '..0..',
      '.....'],
     ['.....',
      '..0..',
      '.00..',
      '..0..',
      '.....']]

shapes = [S, Z, I, O, J, L, T]
shape_colors = [(0, 255, 0), (255, 0, 0), (0, 255, 255), (255, 255, 0), 
                (255, 165, 0), (0, 0, 255), (128, 0, 128)]

class Piece:
    def __init__(self, x, y, shape):
        self.x = x
        self.y = y
        self.shape = shape
        self.color = shape_colors[shapes.index(shape)]
        self.rotation = 0
        # Enhanced animation properties
        self.visual_x = float(x)
        self.visual_y = float(y)
        self.visual_rotation = float(self.rotation)
        self.hold_flash = 0
        self.ghost_opacity = 0.6
        self.landing_shake = 0
    
    def update_visual_position(self):
        # Smooth movement and rotation animation
        lerp_factor = 0.3
        self.visual_x += (self.x - self.visual_x) * lerp_factor
        self.visual_y += (self.y - self.visual_y) * lerp_factor
        
        target_rotation = self.rotation % len(self.shape)
        current_rotation = self.visual_rotation % len(self.shape)
        
        diff = target_rotation - current_rotation
        if abs(diff) > len(self.shape) / 2:
            if diff > 0:
                diff -= len(self.shape)
            else:
                diff += len(self.shape)
        
        self.visual_rotation += diff * lerp_factor
        
        self.hold_flash = max(0, self.hold_flash - 0.05)
        self.landing_shake *= 0.9
        self.ghost_opacity = 0.4 + math.sin(pygame.time.get_ticks() * 0.005) * 0.2

def create_grid(locked_positions={}):
    grid = [[BACKGROUND_COLOR for _ in range(10)] for _ in range(20)]
    
    for i in range(len(grid)):
        for j in range(len(grid[i])):
            if (j, i) in locked_positions:
                c = locked_positions[(j, i)]
                grid[i][j] = c
    return grid

def convert_shape_format(piece):
    positions = []
    shape_format = piece.shape[piece.rotation % len(piece.shape)]

    for i, line in enumerate(shape_format):
        row = list(line)
        for j, column in enumerate(row):
            if column == '0':
                positions.append((piece.x + j, piece.y + i))

    for i, pos in enumerate(positions):
        positions[i] = (pos[0] - 2, pos[1] - 4)

    return positions

def valid_space(piece, grid):
    accepted_pos = [[(j, i) for j in range(10) if grid[i][j] == BACKGROUND_COLOR] for i in range(20)]
    accepted_pos = [j for sub in accepted_pos for j in sub]

    formatted = convert_shape_format(piece)

    for pos in formatted:
        if pos not in accepted_pos:
            if pos[1] > -1:
                return False
    return True

def check_lost(positions):
    for pos in positions:
        x, y = pos
        if y < 1:
            return True
    return False

def get_shape():
    return Piece(5, 0, random.choice(shapes))

def draw_text_middle(text, size, color, surface):
    font = pygame.font.SysFont('comicsans', size, bold=True)
    for i, line in enumerate(text.split('\n')):
        label = font.render(line, 1, color)
        surface.blit(label, (top_left_x + play_width/2 - (label.get_width()/2), 
                            top_left_y + play_height/2 - (label.get_height()/2) + i*size))

def clear_rows(grid, locked):
    inc = 0
    for i in range(len(grid)-1, -1, -1):
        row = grid[i]
        if BACKGROUND_COLOR not in row:
            inc += 1
            ind = i
            for j in range(len(row)):
                try:
                    del locked[(j, i)]
                except:
                    continue

    if inc > 0:
        for key in sorted(list(locked), key=lambda x: x[1])[::-1]:
            x, y = key
            if y < ind:
                newKey = (x, y + inc)
                locked[newKey] = locked.pop(key)

    return inc

# Move draw_stats up - define it before draw_window
def draw_stats(surface, lines, score, level, tetris_count):
    font = pygame.font.SysFont('comicsans', 20)
    stats = [
        f"Lines: {lines}",
        f"Score: {score}",
        f"Level: {level}",
        f"Tetris: {tetris_count}"
    ]
    
    sx = top_left_x + play_width + 30
    sy = top_left_y + 300
    
    for i, stat in enumerate(stats):
        label = font.render(stat, 1, (255, 255, 255))
        surface.blit(label, (sx, sy + i*25))

def draw_next_shape(piece, surface):
    font = pygame.font.SysFont('comicsans', 30)
    label = font.render('Next Shape', 1, (255, 255, 255))
    
    sx = top_left_x + play_width + 50
    sy = top_left_y + play_height/2 - 100
    format = piece.shape[piece.rotation % len(piece.shape)]
    
    for i, line in enumerate(format):
        row = list(line)
        for j, column in enumerate(row):
            if column == '0':
                pygame.draw.rect(surface, piece.color, 
                              (sx + j*block_size, sy + i*block_size, block_size, block_size), 0)

    surface.blit(label, (sx + 10, sy - 30))

def draw_hold_piece(piece, surface):
    if not piece:
        return
        
    font = pygame.font.SysFont('comicsans', 30)
    label = font.render('Hold', 1, (255,255,255))

    sx = top_left_x - 150
    sy = top_left_y + play_height/2 - 100
    format = piece.shape[piece.rotation % len(piece.shape)]

    for i, line in enumerate(format):
        row = list(line)
        for j, column in enumerate(row):
            if column == '0':
                pygame.draw.rect(surface, piece.color, 
                               (sx + j*block_size, sy + i*block_size, block_size, block_size), 0)

    surface.blit(label, (sx + 10, sy - 30))

def draw_window(surface, grid, score=0, level=1, lines_cleared=0, tetris_count=0):
    surface.fill(BACKGROUND_COLOR)

    pygame.font.init()
    font = pygame.font.SysFont('comicsans', 60)
    label = font.render('Tetris', 1, (255,255,255))

    surface.blit(label, (top_left_x + play_width/2 - (label.get_width()/2), 30))

    # Draw score
    font = pygame.font.SysFont('comicsans', 30)
    label = font.render(f'Score: {score}', 1, (255,255,255))
    sx = top_left_x + play_width + 50
    sy = top_left_y + play_height/2 - 100
    surface.blit(label, (sx + 20, sy + 160))

    # Draw level
    label = font.render(f'Level: {level}', 1, (255,255,255))
    surface.blit(label, (sx + 20, sy + 200))

    # Draw additional stats
    draw_stats(surface, lines_cleared, score, level, tetris_count)

    for i in range(len(grid)):
        for j in range(len(grid[i])):
            pygame.draw.rect(surface, grid[i][j], 
                           (top_left_x + j*block_size, top_left_y + i*block_size, block_size, block_size), 0)

    pygame.draw.rect(surface, UI_BORDER_COLOR, (top_left_x, top_left_y, play_width, play_height), 4)

    effects.update()
    effects.draw(surface)

def get_fall_speed(level):
    return max(0.15, 0.8 - (level-1) * 0.05)  # Speed increases with level

def draw_ghost_piece(piece, grid, surface):
    ghost = Piece(piece.x, piece.y, piece.shape)
    ghost.rotation = piece.rotation
    
    # Move ghost piece down as far as possible
    while valid_space(ghost, grid):
        ghost.y += 1
    ghost.y -= 1
    
    # Draw with transparency
    positions = convert_shape_format(ghost)
    for pos in positions:
        x, y = pos
        if y > -1:
            ghost_color = (*piece.color[:3], 100)  # Add alpha for transparency
            pygame.draw.rect(surface, ghost_color, 
                          (top_left_x + x*block_size, 
                           top_left_y + y*block_size, 
                           block_size, block_size), 1)

def wall_kick(piece, grid):
    # Try offset positions in this order: right, left, up
    offsets = [(1, 0), (-1, 0), (0, -1)]
    original_x, original_y = piece.x, piece.y
    
    for offset_x, offset_y in offsets:
        piece.x += offset_x
        piece.y += offset_y
        if valid_space(piece, grid):
            return True  # Found valid position
        piece.x, piece.y = original_x, original_y
    
    return False  # No valid position found

def update_score(lines_cleared, level, combo_count):
    base_points = {0: 0, 1: 100, 2: 300, 3: 500, 4: 800}
    combo_bonus = max(50 * combo_count * level, 0) if combo_count > 1 else 0
    return base_points[lines_cleared] * level + combo_bonus

def save_high_score(score):
    try:
        with open("highscore.txt", "r") as f:
            high_score = int(f.read())
    except:
        high_score = 0
    
    if score > high_score:
        with open("highscore.txt", "w") as f:
            f.write(str(score))
        return True, score
    return False, high_score

def main():
    global effects, win  # Add win to the global declaration
    
    # Reset effects for new game
    effects = VisualEffects()
    
    locked_positions = {}
    grid = create_grid(locked_positions)
    
    change_piece = False
    run = True
    current_piece = get_shape()
    next_piece = get_shape()
    clock = pygame.time.Clock()
    fall_time = 0
    fall_speed = 0.27
    score = 0
    level = 1
    lines_cleared = 0
    hold_piece = None
    can_hold = True
    tetris_count = 0  # Track number of tetris clears (4 lines at once)
    combo_count = 0   # Track consecutive line clears
    paused = False    # Local paused variable

    # Set level from menu selection
    try:
        level = level_select_menu()
        fall_speed = get_fall_speed(level)
    except Exception as e:
        with open("tetris_error.log", "a") as f:
            f.write(f"{traceback.format_exc()}\n")
        print(f"Error: {e}")
        return  # Return to main menu if level selection fails

    # Add near the top of main loop:
    FPS = 60  # Target frames per second

    while run:
        grid = create_grid(locked_positions)
        fall_time += clock.get_rawtime()
        clock.tick(FPS)  # Limit the frame rate

        if fall_time/1000 > fall_speed:
            fall_time = 0
            current_piece.y += 1
            if not valid_space(current_piece, grid) and current_piece.y > 0:
                current_piece.y -= 1
                change_piece = True

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False
                pygame.display.quit()

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    current_piece.x -= 1
                    if not valid_space(current_piece, grid):
                        current_piece.x += 1

                if event.key == pygame.K_RIGHT:
                    current_piece.x += 1
                    if not valid_space(current_piece, grid):
                        current_piece.x -= 1

                if event.key == pygame.K_DOWN:
                    current_piece.y += 1
                    if not valid_space(current_piece, grid):
                        current_piece.y -= 1

                if event.key == pygame.K_UP:
                    current_piece.rotation += 1
                    if not valid_space(current_piece, grid):
                        # Try wall kick if normal rotation fails
                        if not wall_kick(current_piece, grid):
                            current_piece.rotation -= 1

                if event.key == pygame.K_c and can_hold:
                    if hold_piece is None:
                        hold_piece = current_piece
                        current_piece = next_piece
                        next_piece = get_shape()
                    else:
                        hold_piece, current_piece = current_piece, hold_piece
                        current_piece.rotation = 0
                        current_piece.x, current_piece.y = 5, 0
                    can_hold = False

                if event.key == pygame.K_SPACE:
                    while valid_space(current_piece, grid):
                        current_piece.y += 1
                    current_piece.y -= 1
                    change_piece = True

                if event.key == pygame.K_p:
                    paused = not paused

        if paused:
            draw_text_middle("PAUSED", 60, (255, 255, 255), win)
            pygame.display.update()
            # Need to keep checking for events during pause
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN and event.key == pygame.K_p:
                    paused = False
                if event.type == pygame.QUIT:
                    run = False
                    pygame.quit()
            clock.tick(10)  # Slow down tick rate while paused
            continue

        current_piece.update_visual_position()

        shape_pos = convert_shape_format(current_piece)

        for i in range(len(shape_pos)):
            x, y = shape_pos[i]
            if y > -1:
                grid[y][x] = current_piece.color

        if change_piece:
            for pos in shape_pos:
                p = (pos[0], pos[1])
                locked_positions[p] = current_piece.color
            current_piece = next_piece
            next_piece = get_shape()
            change_piece = False
            can_hold = True

            cleared_rows = clear_rows(grid, locked_positions)
            if cleared_rows > 0:
                score += cleared_rows * 100 * level
                lines_cleared += cleared_rows
                combo_count += 1
                
                # Count tetris clears (4 rows at once)
                if cleared_rows == 4:
                    tetris_count += 1
                
                if lines_cleared >= level * 10:
                    level += 1
                    fall_speed = get_fall_speed(level)
                
                # Add particle effects for cleared rows
                for i in range(cleared_rows):
                    for x in range(10):
                        effects.add_landing_effect(
                            top_left_x + x * block_size,
                            top_left_y + (19-i) * block_size,
                            current_piece.color
                        )
            else:
                combo_count = 0

        draw_window(win, grid, score, level, lines_cleared, tetris_count)
        draw_next_shape(next_piece, win)
        if hold_piece:
            draw_hold_piece(hold_piece, win)
        draw_ghost_piece(current_piece, grid, win)
        pygame.display.update()

        if check_lost(locked_positions):
            draw_text_middle("Game Over!", 80, (255,255,255), win)
            pygame.display.update()
            pygame.time.delay(1500)
            run = False

def level_select_menu():
    level = 1
    while True:
        try:
            # Draw level selection screen
            win.fill(BACKGROUND_COLOR)
            draw_text_middle(f"Select Level: {level}\nPress ENTER to start\nUP/DOWN to change level", 35, (255, 255, 255), win)
            
            # Handle level selection
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    return 1  # Return default level instead of exiting
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_UP:
                        level = min(level + 1, 10)
                    if event.key == pygame.K_DOWN:
                        level = max(level - 1, 1)
                    if event.key == pygame.K_RETURN:
                        return level
                    if event.key == pygame.K_ESCAPE:
                        return 1  # Return default level instead of exiting
            
            pygame.display.update()
        except Exception as e:
            with open("tetris_error.log", "a") as f:
                f.write(f"{traceback.format_exc()}\n")
            print(f"Error: {e}")
            return 1  # Return default level on error

def main_menu():
    run = True
    
    while run:
        try:
            win.fill(BACKGROUND_COLOR)
            draw_text_middle("Press ENTER to Play\nESC to Quit", 35, (255,255,255), win)
            pygame.display.update()
            
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    run = False
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_RETURN:
                        try:
                            main()  # Call the main game function
                        except Exception as e:
                            with open("tetris_error.log", "a") as f:
                                f.write(f"{traceback.format_exc()}\n")
                            print(f"Error: {e}")
                            # Don't quit, return to menu
                    elif event.key == pygame.K_ESCAPE:
                        run = False
        except Exception as e:
            with open("tetris_error.log", "a") as f:
                f.write(f"{traceback.format_exc()}\n")
            print(f"Menu error: {e}")
            # Try to recover from menu errors
            pygame.time.delay(1000)
    
    # Only quit pygame when completely exiting the game
    pygame.quit()

if __name__ == '__main__':
    try:
        # Initialize window at the very beginning
        win = pygame.display.set_mode((s_width, s_height))
        pygame.display.set_caption('Tetris')
        main_menu()  # Start with the main menu
    except Exception as e:
        with open("tetris_error.log", "a") as f:
            f.write(f"{traceback.format_exc()}\n")
        print(f"Fatal error: {e}")
        pygame.quit()
