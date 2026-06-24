"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paperSubmissionRoute = exports.authRoute = exports.contactFormRoute = exports.userRoute = void 0;
var userRoutes_1 = require("./userRoutes");
Object.defineProperty(exports, "userRoute", { enumerable: true, get: function () { return __importDefault(userRoutes_1).default; } });
var contactFormRoutes_1 = require("./contactFormRoutes");
Object.defineProperty(exports, "contactFormRoute", { enumerable: true, get: function () { return __importDefault(contactFormRoutes_1).default; } });
var authRoutes_1 = require("./authRoutes");
Object.defineProperty(exports, "authRoute", { enumerable: true, get: function () { return __importDefault(authRoutes_1).default; } });
var paperSubmissionRoutes_1 = require("./paperSubmissionRoutes");
Object.defineProperty(exports, "paperSubmissionRoute", { enumerable: true, get: function () { return __importDefault(paperSubmissionRoutes_1).default; } });
