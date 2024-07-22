const jwt = require("jsonwebtoken");
const isAuthenticated = async (req, res, next) => {
  const headerObj = req.headers;
  //get the token from the header
  const token = headerObj?.authorization?.split(" ")[1];

  //!verify token
  const verifyToken = jwt.verify(token, "mohana", (err, decoded) => {
    //decoded contains token issued and expiration time
    if (err) {
      return false;
    } else {
      return decoded;
    }
  });
  if (verifyToken) {
    //save the user req object
    req.user = verifyToken.id; //here we are saving the token we sent through postman in req object named "user"
    //now we will sen this user as dynamic id
    next();
  } else {
    const err = new Error("token or session expired");
    next(err);
  }
};
module.exports = isAuthenticated;
