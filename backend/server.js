import express from 'express';

const app = express();

app.listen(25565, () => {
  console.log('Server is running on port 25565');
});

app.get("/api/tasks", (req, res) => {
    res.send("Hello 100 World");
});