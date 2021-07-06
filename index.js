require("dotenv").config();
const fastify = require("fastify")({ logger: true });

const firebase = require("firebase/app");
require("firebase/auth");
// Create an env file and populate the given fields in order firebase to work.
const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
};

// Register middleware.
fastify.register(require("fastify-sensible"));
fastify.register(require("fastify-formbody"));
fastify.register(require("point-of-view"), {
  engine: {
    pug: require("pug"),
  },
});

// Initialize Firebase.
firebase.initializeApp(firebaseConfig);

// Gets the login page.
fastify.get("/", async (request, reply) => {
  reply.view("index.pug");
});

// Authenticates login details.
fastify.post("/", async (request, reply) => {
  const email = await request.body.email;
  const password = await request.body.password;

  if (firebase.auth().currentUser) {
    firebase.auth().signOut();
  } else {
    if (password.length < 6) {
      reply.send("Please enter a password that is at least 6 characters.");
    }
    // Sign in with email and pass.
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCreds) => {
        reply.send("Success!");
      })
      .catch(function (error) {
        // Handle errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === "auth/wrong-password") {
          reply.send("Wrong password.");
        } else {
          reply.send(errorMessage);
        }
        reply.send(error);
      });
  }
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
