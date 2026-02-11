import "./storage.js";
import React from "react";
import ReactDOM from "react-dom/client";
import TravelBucketList from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return React.createElement("div", { style: { padding: 40, fontFamily: "monospace" } },
        React.createElement("h1", null, "Something went wrong"),
        React.createElement("pre", { style: { whiteSpace: "pre-wrap", color: "red" } }, this.state.error.toString()),
        React.createElement("pre", { style: { whiteSpace: "pre-wrap", fontSize: 12, marginTop: 10 } }, this.state.error.stack)
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(ErrorBoundary, null,
    React.createElement(React.StrictMode, null,
      React.createElement(TravelBucketList)
    )
  )
);
