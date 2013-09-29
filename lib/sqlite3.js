exports.attributes = function(conn, table, done) {
  var sql = 'PRAGMA table_info("' + escape(table) + '")'

  return conn.all(sql, function(err, columns) {
    if (err) return done(err)
    done(null, attributify(columns))
  })
}

function attributify(columns) {
  return columns.reduce(function(attrs, column) {
    var attr = attrs[column.name] = {}
    attr.null = !column.notnull
    attr.type = parseType(column.type)
    attr.default = parseDefault(attr.type, column.dflt_value)
    attr.limit = parseLimit(column.type)

    return attrs
  }, {})
}

function escape(name) {
  return name.replace('"', '""')
}

function quote(name) {
  return '"' + escape(name) + '"'
}

// https://www.sqlite.org/datatype3.html
var TYPES = {
  // Resulting affinity: INTEGER
  INT: Number,
  INTEGER: Number,
  TINYINT: Number,
  SMALLINT: Number,
  MEDIUMINT: Number,
  BIGINT: Number,
  "UNSIGNED BIG INT": Number,
  INT2: Number,
  INT8: Number,

  // Resulting affinity: TEXT
  CHARACTER: String,
  VARCHAR: String,
  "VARYING CHARACTER": String,
  NCHAR: String,
  "NATIVE CHARACTER": String,
  NVARCHAR: String,
  TEXT: String,
  CLOB: String,

  // Resulting affinity: NONE
  BLOB: String,

  // Resulting affinity: REAL
  REAL: Number,
  DOUBLE: Number,
  "DOUBLE PRECISION": Number,
  FLOAT: Number,

  // Resulting affinity: NUMERIC
  NUMERIC: Number,
  DECIMAL: Number,
  BOOLEAN: Boolean,

  // Custom
  DATE: Number,
  DATETIME: Number,
}

function parseType(type) {
  var type = type.match(/^([^(]+)/)
  return TYPES[type && type[0]] || String
}

function parseDefault(type, value) {
  if (value == null) return value

  switch (type) {
    case String:
      return value.replace(/^(["'])(.*)\1$/, "$2")

    default:
      return type(value)
  }
}

function parseLimit(type) {
  var limit = type.match(/\((\d+)\)$/)
  return limit && parseInt(limit[1], 10)
}