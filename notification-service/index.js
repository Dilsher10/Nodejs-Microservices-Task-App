const amqp = require('amqplib')

async function start() {
    try {
        connection = await amqp.connect("amqp://rabbitmq")
        channel = await connection.createChannel()
        await channel.assertQueue("task_created")
        console.log("Notification service is listning to messages")
        channel.consume("task_created", (message) => {
            const taskData = JSON.parse(message.content.toString());
            console.log("Notification: NEW TASK: ", taskData.title);
            console.log("Notification: NEW TASK: ", taskData);
            channel.ack(message)
        })
    } catch (error) {
        console.error("RabbitMQ Connection Error : ", error.message)
    }
}

start()