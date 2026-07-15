// ===============================
// GLOBAL VARIABLES
// ===============================

let tasks = [];

let currentFilter = "all";


// ===============================
// PAGE LOAD
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadTasks();

        displayCurrentDate();

    }
);


// ===============================
// DISPLAY CURRENT DATE
// ===============================

function displayCurrentDate() {

    const date = new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    document.getElementById(
        "currentDate"
    ).textContent =
        date.toLocaleDateString(
            "en-US",
            options
        );
}


// ===============================
// LOAD TASKS FROM PYTHON API
// ===============================

async function loadTasks() {

    try {

        const response =
            await fetch("/api/tasks");

        tasks =
            await response.json();

        renderTasks();

        updateStatistics();

    }

    catch (error) {

        console.error(
            "Error loading tasks:",
            error
        );

        showToast(
            "Unable to load tasks"
        );

    }

}


// ===============================
// RENDER TASKS
// ===============================

function renderTasks() {

    const taskList =
        document.getElementById(
            "taskList"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    const searchValue =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .toLowerCase();

    const priorityValue =
        document
            .getElementById(
                "priorityFilter"
            )
            .value;


    let filteredTasks =
        tasks.filter(
            function (task) {

                // FILTER BY STATUS

                let statusMatch = true;

                if (
                    currentFilter ===
                    "active"
                ) {

                    statusMatch =
                        task.completed === 0;

                }

                else if (
                    currentFilter ===
                    "completed"
                ) {

                    statusMatch =
                        task.completed === 1;

                }


                // FILTER BY SEARCH

                const searchMatch =

                    task.title
                        .toLowerCase()
                        .includes(
                            searchValue
                        )

                    ||

                    (
                        task.description || ""
                    )
                        .toLowerCase()
                        .includes(
                            searchValue
                        );


                // FILTER BY PRIORITY

                const priorityMatch =

                    priorityValue ===
                    "all"

                    ||

                    task.priority ===
                    priorityValue;


                return (

                    statusMatch

                    &&

                    searchMatch

                    &&

                    priorityMatch

                );

            }
        );


    taskList.innerHTML = "";


    document.getElementById(
        "taskResultCount"
    ).textContent =

        filteredTasks.length +

        (
            filteredTasks.length === 1

                ? " task"

                : " tasks"
        );


    if (
        filteredTasks.length === 0
    ) {

        emptyState.style.display =
            "block";

        return;

    }


    emptyState.style.display =
        "none";


    filteredTasks.forEach(
        function (task) {

            const card =
                createTaskCard(task);

            taskList.appendChild(card);

        }
    );

}


// ===============================
// CREATE TASK CARD
// ===============================

function createTaskCard(task) {

    const taskCard =
        document.createElement("div");


    taskCard.className =

        "task-card " +

        "priority-" +

        task.priority.toLowerCase();


    if (
        task.completed === 1
    ) {

        taskCard.classList.add(
            "completed"
        );

    }


    const dueDate =

        task.due_date

            ? formatDate(
                task.due_date
            )

            : "No due date";


    taskCard.innerHTML = `

        <input

            type="checkbox"

            class="task-checkbox"

            ${task.completed === 1
                ? "checked"
                : ""
            }

            onchange="
                toggleComplete(
                    ${task.id},
                    this.checked
                )
            "

        >


        <div class="task-info">

            <h3>
                ${escapeHTML(
                    task.title
                )}
            </h3>


            <p>

                ${escapeHTML(

                    task.description

                    ||

                    "No description"

                )}

            </p>


            <div class="task-meta">


                <span
                    class="
                        badge
                        category-badge
                    "
                >

                    ${escapeHTML(
                        task.category
                    )}

                </span>


                <span
                    class="
                        badge

                        priority-${

                            task.priority
                                .toLowerCase()

                        }-badge
                    "
                >

                    ${task.priority}

                    Priority

                </span>


                <span
                    class="
                        badge
                        date-badge
                    "
                >

                    📅 ${dueDate}

                </span>


            </div>

        </div>


        <div class="task-actions">


            <button

                class="
                    action-button
                    edit-button
                "

                title="Edit Task"

                onclick="
                    editTask(
                        ${task.id}
                    )
                "

            >

                ✏️

            </button>


            <button

                class="
                    action-button
                    delete-button
                "

                title="Delete Task"

                onclick="
                    deleteTask(
                        ${task.id}
                    )
                "

            >

                🗑️

            </button>


        </div>

    `;


    return taskCard;

}


// ===============================
// OPEN ADD TASK MODAL
// ===============================

function openModal() {

    document.getElementById(
        "taskForm"
    ).reset();


    document.getElementById(
        "taskId"
    ).value = "";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Add New Task";


    document.getElementById(
        "taskModal"
    ).classList.add(
        "show"
    );


    document.getElementById(
        "taskTitle"
    ).focus();

}


// ===============================
// CLOSE MODAL
// ===============================

function closeModal() {

    document.getElementById(
        "taskModal"
    ).classList.remove(
        "show"
    );

}


// ===============================
// SAVE TASK
// ===============================

async function saveTask(event) {

    event.preventDefault();


    const taskId =
        document.getElementById(
            "taskId"
        ).value;


    const taskData = {

        title:

            document.getElementById(
                "taskTitle"
            ).value.trim(),


        description:

            document.getElementById(
                "taskDescription"
            ).value.trim(),


        category:

            document.getElementById(
                "taskCategory"
            ).value,


        priority:

            document.getElementById(
                "taskPriority"
            ).value,


        due_date:

            document.getElementById(
                "taskDueDate"
            ).value

    };


    if (!taskData.title) {

        showToast(
            "Please enter a task title"
        );

        return;

    }


    try {

        let response;


        if (taskId) {

            // UPDATE EXISTING TASK

            response = await fetch(

                `/api/tasks/${taskId}`,

                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            taskData
                        )

                }

            );

        }

        else {

            // CREATE NEW TASK

            response = await fetch(

                "/api/tasks",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            taskData
                        )

                }

            );

        }


        const result =
            await response.json();


        if (response.ok) {

            closeModal();

            await loadTasks();

            showToast(
                taskId

                    ? "Task updated successfully!"

                    : "Task added successfully!"
            );

        }

        else {

            showToast(
                result.message

                ||

                "Something went wrong"
            );

        }

    }

    catch (error) {

        console.error(
            "Save error:",
            error
        );

        showToast(
            "Unable to save task"
        );

    }

}


// ===============================
// EDIT TASK
// ===============================

function editTask(taskId) {

    const task =
        tasks.find(

            function (item) {

                return item.id === taskId;

            }

        );


    if (!task) {

        return;

    }


    document.getElementById(
        "taskId"
    ).value =
        task.id;


    document.getElementById(
        "taskTitle"
    ).value =
        task.title;


    document.getElementById(
        "taskDescription"
    ).value =
        task.description || "";


    document.getElementById(
        "taskCategory"
    ).value =
        task.category;


    document.getElementById(
        "taskPriority"
    ).value =
        task.priority;


    document.getElementById(
        "taskDueDate"
    ).value =
        task.due_date || "";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Task";


    document.getElementById(
        "taskModal"
    ).classList.add(
        "show"
    );

}


// ===============================
// TOGGLE TASK COMPLETION
// ===============================

async function toggleComplete(

    taskId,

    checked

) {

    try {

        await fetch(

            `/api/tasks/${taskId}/complete`,

            {

                method: "PUT",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        completed:

                            checked
                                ? 1
                                : 0

                    })

            }

        );


        await loadTasks();


        showToast(

            checked

                ? "Task completed! 🎉"

                : "Task marked as active"

        );

    }

    catch (error) {

        console.error(
            error
        );

        showToast(
            "Unable to update task"
        );

    }

}


// ===============================
// DELETE TASK
// ===============================

async function deleteTask(taskId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this task?"
        );


    if (!confirmed) {

        return;

    }


    try {

        await fetch(

            `/api/tasks/${taskId}`,

            {
                method: "DELETE"
            }

        );


        await loadTasks();


        showToast(
            "Task deleted successfully"
        );

    }

    catch (error) {

        console.error(
            error
        );

        showToast(
            "Unable to delete task"
        );

    }

}


// ===============================
// CLEAR COMPLETED TASKS
// ===============================

async function clearCompleted() {

    const completedTasks =
        tasks.filter(

            function (task) {

                return (
                    task.completed === 1
                );

            }

        );


    if (
        completedTasks.length === 0
    ) {

        showToast(
            "No completed tasks to clear"
        );

        return;

    }


    const confirmed =
        confirm(

            "Delete all completed tasks?"

        );


    if (!confirmed) {

        return;

    }


    try {

        await fetch(

            "/api/tasks/completed",

            {
                method: "DELETE"
            }

        );


        await loadTasks();


        showToast(
            "Completed tasks cleared"
        );

    }

    catch (error) {

        console.error(
            error
        );

    }

}


// ===============================
// SET FILTER
// ===============================

function setFilter(

    filter,

    button

) {

    currentFilter =
        filter;


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(

            function (item) {

                item.classList.remove(
                    "active"
                );

            }

        );


    button.classList.add(
        "active"
    );


    const sectionTitle =
        document.getElementById(
            "taskSectionTitle"
        );


    if (
        filter === "all"
    ) {

        sectionTitle.textContent =
            "All Tasks";

    }

    else if (
        filter === "active"
    ) {

        sectionTitle.textContent =
            "Active Tasks";

    }

    else {

        sectionTitle.textContent =
            "Completed Tasks";

    }


    renderTasks();

}


// ===============================
// UPDATE STATISTICS
// ===============================

function updateStatistics() {

    const total =
        tasks.length;


    const completed =
        tasks.filter(

            function (task) {

                return (
                    task.completed === 1
                );

            }

        ).length;


    const active =
        total - completed;


    document.getElementById(
        "totalTasks"
    ).textContent =
        total;


    document.getElementById(
        "activeTasks"
    ).textContent =
        active;


    document.getElementById(
        "completedTasks"
    ).textContent =
        completed;


    document.getElementById(
        "allCount"
    ).textContent =
        total;


    document.getElementById(
        "activeCount"
    ).textContent =
        active;


    document.getElementById(
        "completedCount"
    ).textContent =
        completed;


    // PROGRESS PERCENTAGE

    const percentage =

        total === 0

            ? 0

            : Math.round(

                (
                    completed /
                    total
                )

                * 100

            );


    document.getElementById(
        "progressPercentage"
    ).textContent =

        percentage + "%";


    document.getElementById(
        "progressFill"
    ).style.width =

        percentage + "%";


    document.getElementById(
        "progressText"
    ).textContent =

        `${completed} of ${total} tasks completed`;

}


// ===============================
// FORMAT DATE
// ===============================

function formatDate(dateString) {

    const date =
        new Date(
            dateString + "T00:00:00"
        );


    return date.toLocaleDateString(

        "en-US",

        {

            month: "short",

            day: "numeric",

            year: "numeric"

        }

    );

}


// ===============================
// SHOW TOAST MESSAGE
// ===============================

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(

        function () {

            toast.classList.remove(
                "show"
            );

        },

        2500

    );

}


// ===============================
// ESCAPE HTML
// SECURITY FUNCTION
// ===============================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// ===============================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ===============================

window.addEventListener(

    "click",

    function (event) {

        const modal =
            document.getElementById(
                "taskModal"
            );


        if (
            event.target === modal
        ) {

            closeModal();

        }

    }

);


// ===============================
// CLOSE MODAL WITH ESCAPE KEY
// ===============================

document.addEventListener(

    "keydown",

    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeModal();

        }

    }

);