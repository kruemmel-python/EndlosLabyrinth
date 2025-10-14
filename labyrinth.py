"""Utility functions for generating and manipulating labyrinths.

The module contains a simple depth-first maze generator that produces
perfect mazes (every cell is reachable and there is a unique path between
any two cells).  The generator operates on odd-sized grids so that walls can
be represented cleanly between walkable cells.
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Iterable, List, Sequence, Tuple
import random

Cell = Tuple[int, int]
Maze = List[List[int]]  # 0 represents a walkable cell, 1 represents a wall


@dataclass(frozen=True)
class Move:
    name: str
    delta_row: int
    delta_col: int


MOVES: Sequence[Move] = (
    Move("up", -1, 0),
    Move("down", 1, 0),
    Move("left", 0, -1),
    Move("right", 0, 1),
)


def generate_maze(width: int, height: int, rng: random.Random | None = None) -> Maze:
    """Generate a perfect maze using randomized depth-first search."""
    if rng is None:
        rng = random.Random()

    width = width if width % 2 == 1 else width + 1
    height = height if height % 2 == 1 else height + 1

    maze = [[1 for _ in range(width)] for _ in range(height)]

    def carve_passage(row: int, col: int) -> None:
        maze[row][col] = 0
        neighbors = [(row + dr * 2, col + dc * 2, dr, dc) for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1))]
        rng.shuffle(neighbors)
        for nr, nc, dr, dc in neighbors:
            if 1 <= nr < height - 1 and 1 <= nc < width - 1 and maze[nr][nc] == 1:
                maze[row + dr][col + dc] = 0
                carve_passage(nr, nc)

    carve_passage(1, 1)
    return maze


def farthest_cell(maze: Maze, start: Cell) -> Cell:
    """Return the cell farthest from ``start`` using Manhattan distance in the maze."""
    height = len(maze)
    width = len(maze[0]) if height else 0
    visited = [[False] * width for _ in range(height)]
    queue = deque([(start, 0)])
    visited[start[0]][start[1]] = True
    last_cell = start
    max_distance = 0

    while queue:
        (row, col), dist = queue.popleft()
        if dist > max_distance:
            max_distance = dist
            last_cell = (row, col)
        for move in MOVES:
            nr, nc = row + move.delta_row, col + move.delta_col
            if 0 <= nr < height and 0 <= nc < width and not visited[nr][nc] and maze[nr][nc] == 0:
                visited[nr][nc] = True
                queue.append(((nr, nc), dist + 1))

    return last_cell


def apply_move(maze: Maze, position: Cell, move_name: str) -> Cell:
    """Attempt to move the player in the maze.

    If the move would hit a wall or leave the maze bounds the player's position
    is returned unchanged.
    """
    height = len(maze)
    width = len(maze[0]) if height else 0
    for move in MOVES:
        if move.name == move_name:
            nr = position[0] + move.delta_row
            nc = position[1] + move.delta_col
            if 0 <= nr < height and 0 <= nc < width and maze[nr][nc] == 0:
                return nr, nc
            return position
    return position


def serialize_maze(maze: Maze) -> List[List[int]]:
    return [row[:] for row in maze]


def deserialize_maze(data: Sequence[Sequence[int]]) -> Maze:
    return [list(row) for row in data]


def iter_walkable_cells(maze: Maze) -> Iterable[Cell]:
    for r, row in enumerate(maze):
        for c, value in enumerate(row):
            if value == 0:
                yield (r, c)
