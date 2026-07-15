from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

DATABASE = "tasks.db"


# ---------------- DATABASE CONNECTION ----------------
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# ---------------- CREATE DATABASE TABLE ----------------
def create_table():
    conn = get_db_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'General',
            priority TEXT DEFAULT 'Medium',
            due_date TEXT,
            completed INTEGER DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()


# ---------------- HOME PAGE ----------------
@app.route("/")
def home():
    return render_template("index.html")


# ---------------- GET ALL TASKS ----------------
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    conn = get_db_connection()

    tasks = conn.execute("""
        SELECT * FROM tasks
        ORDER BY completed ASC, id DESC
    """).fetchall()

    conn.close()

    return jsonify([dict(task) for task in tasks])


# ---------------- ADD TASK ----------------
@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json()

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    category = data.get("category", "General")
    priority = data.get("priority", "Medium")
    due_date = data.get("due_date", "")

    if not title:
        return jsonify({
            "success": False,
            "message": "Task title is required"
        }), 400

    conn = get_db_connection()

    cursor = conn.execute("""
        INSERT INTO tasks
        (title, description, category, priority, due_date)
        VALUES (?, ?, ?, ?, ?)
    """, (
        title,
        description,
        category,
        priority,
        due_date
    ))

    conn.commit()

    task_id = cursor.lastrowid

    task = conn.execute(
        "SELECT * FROM tasks WHERE id = ?",
        (task_id,)
    ).fetchone()

    conn.close()

    return jsonify({
        "success": True,
        "message": "Task added successfully",
        "task": dict(task)
    })


# ---------------- UPDATE TASK ----------------
@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json()

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    category = data.get("category", "General")
    priority = data.get("priority", "Medium")
    due_date = data.get("due_date", "")

    if not title:
        return jsonify({
            "success": False,
            "message": "Task title is required"
        }), 400

    conn = get_db_connection()

    conn.execute("""
        UPDATE tasks
        SET title = ?,
            description = ?,
            category = ?,
            priority = ?,
            due_date = ?
        WHERE id = ?
    """, (
        title,
        description,
        category,
        priority,
        due_date,
        task_id
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Task updated successfully"
    })


# ---------------- COMPLETE / UNCOMPLETE TASK ----------------
@app.route("/api/tasks/<int:task_id>/complete", methods=["PUT"])
def complete_task(task_id):
    data = request.get_json()

    completed = data.get("completed", 0)

    conn = get_db_connection()

    conn.execute("""
        UPDATE tasks
        SET completed = ?
        WHERE id = ?
    """, (
        completed,
        task_id
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Task status updated"
    })


# ---------------- DELETE TASK ----------------
@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = get_db_connection()

    conn.execute(
        "DELETE FROM tasks WHERE id = ?",
        (task_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Task deleted successfully"
    })


# ---------------- DELETE ALL COMPLETED TASKS ----------------
@app.route("/api/tasks/completed", methods=["DELETE"])
def delete_completed_tasks():
    conn = get_db_connection()

    conn.execute(
        "DELETE FROM tasks WHERE completed = 1"
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Completed tasks cleared"
    })


# ---------------- RUN APPLICATION ----------------
if __name__ == "__main__":
    create_table()
    app.run(debug=True)