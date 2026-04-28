function problem(status, title, detail = "") { 
  return { type: "about:blank", title, status, detail }; 
} 
function sendProblem(res, status, title, detail = "") { 
  return res 
  .status(status) 
  .type("application/problem+json") 
  .json(problem(status, title, detail)); 
} 
module.exports = { problem, sendProblem };