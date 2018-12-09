const mysql = require("mysql");

const setupPacketsReceivedInChannelTable = (con) => {
  return new Promise((resolve, reject) => {
    var sql =
      "CREATE TABLE packetsReceivedInChannel (clientId VARCHAR(255), longRunningTest1 VARCHAR(255), longRunningTest2 VARCHAR(255), longRunningTest3 VARCHAR(255))";
    con.query(sql, function (err, result) {
      if (err) reject(err);
      resolve("packetsReceived Table Created");
    });
  });
};

const setupSyncTimeTable = (con) => {
  return new Promise((resolve, reject) => {
    var sql =
      "CREATE TABLE syncTime (clientId VARCHAR(255), channel VARCHAR(255), time VARCHAR(255))";
    con.query(sql, function (err, result) {
      if (err) reject(err);
      resolve("SyncTime Table Created");
    });
  });
};

const insertSyncTime = (clientId, channel, time, con) => {
  return new Promise((resolve, reject) => {
    var sql = `INSERT INTO syncTime (clientId, channel, time) VALUES (${clientId}, '${channel}', ${time})`;
    con.query(sql, function (err, result) {
      if (err) reject(err);
      resolve("inserted");
    });
  });
};

const insertPacketsReceived = (clientId, v1, v2, v3, con) => {
  return new Promise((resolve, reject) => {
    var sql = `INSERT INTO packetsReceivedInChannel (clientId, longRunningTest1, longRunningTest2, longRunningTest3) VALUES (${clientId}, ${v1}, ${v2}, ${v3})`;
    con.query(sql, function (err, result) {
      if (err) reject(err);
      resolve("inserted");
    });
  });
};

const createDataBase = (dbName, con) => {
  return new Promise((resolve, reject) => {
    var sql = `CREATE DATABASE ${dbName}`;
    con.query(sql, function (err, result) {
      if (err) reject(err);
      resolve("db created");
    });
  });
};

const useDb = (dbName, con) => {
  return new Promise((resolve, reject) => {
    var sql = `USE ${dbName}`;
    con.query(sql, function (err, result) {
      if (err) reject(err);
      resolve("db used");
    });
  });
};

const createCon = async () => {
  return new Promise((resolve, reject) => {
    const con = mysql.createConnection({
      host: "database-1.cfghbkhwutdy.ap-south-1.rds.amazonaws.com",
      user: "rateria",
      password: "qwerty1234",
    });

    con.connect(function (err) {
      if (err) reject(err);
      resolve(con);
    });
  });
};

module.exports = {
  createCon,
  createDataBase,
  useDb,
  insertPacketsReceived,
  insertSyncTime,
  setupPacketsReceivedInChannelTable,
  setupSyncTimeTable,
};
