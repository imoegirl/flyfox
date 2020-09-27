import server from "./server.mjs";

function Handle_Hello() {
  console.log("Say Hello from Handler");
  server.Hello();
}

export default Handle_Hello;
