const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const amqp = require('amqplib')
const app = express()
const port = 3002

app.use(bodyParser.json())

mongoose.connect('mongodb://mongo:27017/users')
  .then(() => console.log("Connected to MongoDB"))
  .catch(error => console.error("MongoDB connection failed: ", error))


const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Task = mongoose.model('Task', TaskSchema)

let channel, connection;

async function connectRabbitMQWithRetry(retries = 5,delay = 3000) {
  while(retries){
    try {
      connection = await amqp.connect("amqp://rabbitmq")
      channel = await connection.createChannel()
      await channel.assertQueue("task_created")
      console.log("Connected to RabbitMQ")
      return
    } catch (error) {
      console.error("RabbitMQ Connection Error : ", error.message)
      retries--
      console.error("Retrying again : ", retries)
      await new Promise(response => setTimeout(response, delay))
    }
  }
}

app.get('/tasks', async (request, response) => {
  const tasks = await Task.find()
  response.json(tasks)
})

app.post('/tasks', async (request, response) => {
  const { title, description, userId } = request.body
  try {
    const task = new Task({ title, description, userId })
    await task.save()

    const message = {taskId: task._id, userId, title}
    if(!channel){
      return response.status(503).json({error: "RabbitMQ not connected"})
    }

    channel.sendToQueue("task_created", Buffer.from(
      JSON.stringify(message)
    ))

    response.status(201).json(task)
  } catch (error) {
    console.error('Task saving failed: ', error);
    response.status(500).json({ error: 'Internal Server Error' })
  }
})



app.listen(port, () => {
  console.log(`Task service listening on port ${port}`)
  connectRabbitMQWithRetry()
})


