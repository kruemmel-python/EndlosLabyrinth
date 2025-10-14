from __future__ import annotations

import random
from typing import Dict, Tuple

from flask import Flask, redirect, render_template, request, session, url_for

from labyrinth import (
    apply_move,
    deserialize_maze,
    farthest_cell,
    generate_maze,
    serialize_maze,
)

app = Flask(__name__)
app.config["SECRET_KEY"] = "endlos-labyrinth-secret-key"


def _new_game(width: int = 15, height: int = 15) -> None:
    rng = random.Random()
    maze = generate_maze(width, height, rng)
    start = (1, 1)
    goal = farthest_cell(maze, start)
    session["maze"] = serialize_maze(maze)
    session["player"] = start
    session["goal"] = goal
    session["moves"] = 0
    session["visited"] = [f"{start[0]}:{start[1]}"]


def _get_state() -> Dict[str, object]:
    maze = deserialize_maze(session.get("maze", []))
    player = tuple(session.get("player", (1, 1)))
    goal = tuple(session.get("goal", (len(maze) - 2, len(maze[0]) - 2))) if maze else (1, 1)
    visited = set(session.get("visited", []))
    moves = session.get("moves", 0)
    return {
        "maze": maze,
        "player": player,
        "goal": goal,
        "visited": visited,
        "moves": moves,
    }


@app.route("/")
def index():
    if "maze" not in session:
        _new_game()
    state = _get_state()
    won = state["player"] == state["goal"]
    return render_template("index.html", state=state, won=won)


@app.post("/move")
def move():
    direction = request.form.get("direction")
    if not direction:
        return redirect(url_for("index"))
    state = _get_state()
    if not state["maze"]:
        _new_game()
        return redirect(url_for("index"))
    old_position: Tuple[int, int] = state["player"]
    new_position = apply_move(state["maze"], old_position, direction)
    if new_position != old_position:
        session["player"] = new_position
        session["moves"] = state["moves"] + 1
        visited = set(state["visited"])
        visited.add(f"{new_position[0]}:{new_position[1]}")
        session["visited"] = list(visited)
    return redirect(url_for("index"))


@app.post("/reset")
def reset():
    _new_game()
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
