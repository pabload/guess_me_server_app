import express from 'express'
const router = express.Router();

router.get('/', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.send('<h1>Hello world</h1>');
});


export default router;