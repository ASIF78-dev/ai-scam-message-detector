export function optionalAuth(req,res,next){
  // Authentication will be implemented in the next phase. Keeping this middleware optional
  // lets the scanner work during initial development.
  next();
}
