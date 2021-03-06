/*
 * jsonify
 * https://github.com/eward/jsonify
 *
 * Copyright (c) 2013 shepherdwind
 * Licensed under the MIT license.
 */

'use strict';

var Velocity = require('velocityjs')
var utils = require('./utils')
var text = require('./text')(utils)

var jsonify = function(str, context){

  var asts = Velocity.Parser.parse(str)
  this.context = context || {}
  this.lists = {};
  this.tokens = []
  this.show(asts)

  var obj = {}

  utils.forEach(this.tokens, function(token){

    var text = token.replace(/\$/g, '@@').replace(/"/g, '==')

    var start = '{{{'
    if (this.lists[token]) {
      start += ':list: '
    }

    obj[text] = start + token + '}}}'

  }, this)

  this.str = (JSON.stringify(obj, null, 2)).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  return str

}

jsonify.prototype = {

  constructor : jsonify,

  toJson: function(){ return this.str },

  eval: function(str){
    var asts = Velocity.Parser.parse(str)
    this.show(asts)
  },

  show: function(ast){

    var self = this;

    if (utils.isArray(ast)) {
      return utils.forEach(ast, self.show, self)
    } 

    var type = ast.type;

    if (type && type !== 'comment') {

      if (type === 'references') {

        if (ast.id in this.context){

          var caller = this.context[ast.id]

          ast.path.forEach(function(key){

            if (typeof caller[key] == 'function') {
              caller[key].apply(this, ast.args.map(function(arg){
                return arg.value
              }))
            } else {
              caller = caller[key]
            }
          })

        } else {
          self.tokens.push(text(ast))
        }

        return ;
      }

      if (type === 'if' || type === 'elseif') {
        return self.show(ast.condition)
      }

      if (type === 'foreach') {
        self.lists[text(ast.from)] = true
        return self.show(ast.from)
        //return self.show(ast.condition)
      }

      if (type === 'math') {
        return self.show(ast.expression)
      }

      if (type === 'string' && ast.isEval) {
        return self.show(Velocity.Parser.parse(ast.value))
      }

    }

  }

};


module.exports = jsonify;
