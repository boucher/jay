(function(){ 

Number.prototype["+"] = function(other) {
  return this + other
}

})()