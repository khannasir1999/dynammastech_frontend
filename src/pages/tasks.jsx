import { useState, useEffect } from "react";
import "../task.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const getPriorityClass = (priority) => {
  const priorityMap = {
    Low: "priority-low",
    Medium: "priority-medium",
    High: "priority-high",
  };
  return priorityMap[priority] || "";
};

const getPriorityOrder = (priority) => {
  const priorityOrder = {
    High: 3,
    Medium: 2,
    Low: 1,
  };
  return priorityOrder[priority] || 0;
};

const sortTasks = (tasks) => {
  return [...tasks].sort((a, b) => {
    // First, sort by priority (High > Medium > Low)
    const priorityDiff = getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    
    // If priorities are the same, sort by due date (earlier dates first)
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    return dateA - dateB;
  });
};

const Tasks = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "",
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      // Sort tasks: High priority first, then by earlier due date
      const sortedTasks = sortTasks(data);
      setTasks(sortedTasks);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      await response.json();
      // Refresh tasks list
      await fetchTasks();

      setFormData({
        title: "",
        description: "",
        dueDate: "",
        priority: "",
      });
    } catch (err) {
      setError(err.message);
      console.error("Error creating task:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id) => {
    try {
      const task = tasks.find((t) => t._id === id);
      if (!task) return;

      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          completed: !task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      // Refresh tasks list
      await fetchTasks();
    } catch (err) {
      setError(err.message);
      console.error("Error updating task:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      // Refresh tasks list
      await fetchTasks();
    } catch (err) {
      setError(err.message);
      console.error("Error deleting task:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container">
      <h1>Task Manager</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem", padding: "0.5rem" }}>
          Error: {error}
        </div>
      )}

      {/* Form */}
      <form className="task-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Task Title"
          value={formData.title}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <textarea
          name="description"
          placeholder="Task Description"
          value={formData.description}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <div className="date-input-wrapper">
          <label htmlFor="dueDate" className="date-label">
            Due Date
          </label>
          <input
            id="dueDate"
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="" disabled>
            Select Priority
          </option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Task"}
        </button>
      </form>

      {/* Table */}
      {loading && tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          Loading tasks...
        </div>
      ) : (
        <table className="task-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-task">
                  No tasks added
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task._id}>
                  <td>{task.title}</td>
                  <td>{task.description}</td>
                  <td>{formatDate(task.dueDate)}</td>
                  <td className={getPriorityClass(task.priority)}>
                    {task.priority}
                  </td>
                  <td>
                    <button
                      className={
                        task.completed ? "status complete" : "status pending"
                      }
                      onClick={() => toggleComplete(task._id)}
                      disabled={loading}
                    >
                      {task.completed ? "Completed" : "Pending"}
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(task._id)}
                      disabled={loading}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Tasks;
