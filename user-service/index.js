const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const app = express()
const port = 3001

app.use(bodyParser.json())

mongoose.connect('mongodb://mongo:27017/users')
  .then(() => console.log("Connected to MongoDB"))
  .catch(error => console.error("MongoDB connection failed: ", error))


const UserSchema = new mongoose.Schema({
  name: String,
  email: String
})

const User = mongoose.model('User', UserSchema)

app.get('/users', async (request, response) => {
  const users = await User.find()
  response.json(users)
})

app.post('/users', async (request, response) => {
  const { name, email } = request.body
  try {
    const user = new User({ name, email })
    await user.save()
    response.status(201).json(user)
  } catch (error) {
    console.error('User saving failed: ', error);
    response.status(500).json({ error: 'Internal Server Error' })
  }
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`User service listening on port ${port}`)
})
