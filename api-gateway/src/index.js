"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
var mqtt_service_1 = require("./services/mqtt.service");
dotenv_1.default.config();
var mqttService = new mqtt_service_1.default();
process.on('SIGTERM', function () {
    console.log('Menerima sinyal SIGTERM, melakukan cleanup...');
    mqttService.disconnect();
    process.exit(0);
});
process.on('SIGINT', function () {
    console.log('Menerima sinyal SIGINT, melakukan cleanup...');
    mqttService.disconnect();
    process.exit(0);
});
process.on('uncaughtException', function (error) {
    console.error('Uncaught Exception:', error);
    mqttService.disconnect();
    process.exit(1);
});
process.on('unhandledRejection', function (reason, promise) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    mqttService.disconnect();
    process.exit(1);
});
console.log('Smart Garden API Gateway berjalan...');
