const jwt = require('jsonwebtoken');

const isAuth = (req,res,next)=>{
    const token = req.cookies.token;
  
    if(!token){
       return res.redirect('/');
    }
   
    var user = jwt.verify(token ,process.env.JWT_TOKEN_KEY);
//    console.log(user);
   
    if(!user){
       return res.redirect('/');
    }
   
    req.user = user
    next();
};

const isAdmin = (req, res, next)=>{
    isAuth(req, res,async function(user){
        if(req.user.role === 1){
            next()
        }else{
            req.flash('error_msg', `!!! ONLY ADMIN CAN DO THIS!!!!!!`),
            res.redirect('employee')   
    }
    }
)}

module.exports = {isAdmin,isAuth}