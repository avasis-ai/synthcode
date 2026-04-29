import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type SchemaDiffReport = {
  path: string;
  diffs: {
    field: string;
    message: string;
    severity: "WARNING" | "ERROR";
  }[];
};

export type Schema = Record<string, SchemaField>;

export interface SchemaField {
  type: "object" | "string" | "number" | "boolean" | "array";
  required?: boolean;
  properties?: Schema;
  items?: {
    type: "object" | "string" | "number" | "boolean" | "array";
    required?: boolean;
    properties?: Schema;
    items?: {
      type: "object" | "string" | "number" | "boolean" | "array";
      required?: boolean;
      properties?: Schema;
      items?: {
        type: "object" | "string" | "number" | "boolean" | "array";
        required?: boolean;
        properties?: Schema;
        items?: {
          type: "object" | "string" | "number" | "boolean" | "array";
          required?: boolean;
          properties?: Schema;
          items?: {
            type: "object" | "string" | "number" | "boolean" | "array";
            required?: boolean;
            properties?: Schema;
            items?: {
              type: "object" | "string" | "number" | "boolean" | "array";
              required?: boolean;
              properties?: Schema;
              items?: {
                type: "object" | "string" | "number" | "boolean" | "array";
                required?: boolean;
                properties?: Schema;
                items?: {
                  type: "object" | "string" | "number" | "boolean" | "array";
                  required?: boolean;
                  properties?: Schema;
                  items?: {
                    type: "object" | "string" | "number" | "boolean" | "array";
                    required?: boolean;
                    properties?: Schema;
                    items?: {
                      type: "object" | "string" | "number" | "boolean" | "array";
                      required?: boolean;
                      properties?: Schema;
                      items?: {
                        type: "object" | "string" | "number" | "boolean" | "array";
                        required?: boolean;
                        properties?: Schema;
                        items?: {
                          type: "object" | "string" | "number" | "boolean" | "array";
                          required?: boolean;
                          properties?: Schema;
                          items?: {
                            type: "object" | "string" | "number" | "boolean" | "array";
                            required?: boolean;
                            properties?: Schema;
                            items?: {
                              type: "object" | "string" | "number" | "boolean" | "array";
                              required?: boolean;
                              properties?: Schema;
                              items?: {
                                type: "object" | "string" | "number" | "boolean" | "array";
                                required?: boolean;
                                properties?: Schema;
                                items?: {
                                  type: "object" | "string" | "number" | "boolean" | "array";
                                  required?: boolean;
                                  properties?: Schema;
                                  items?: {
                                    type: "object" | "string" | "number" | "boolean" | "array";
                                    required?: boolean;
                                    properties?: Schema;
                                    items?: {
                                      type: "object" | "string" | "number" | "boolean" | "array";
                                      required?: boolean;
                                      properties?: Schema;
                                      items?: {
                                        type: "object" | "string" | "number" | "boolean" | "array";
                                        required?: boolean;
                                        properties?: Schema;
                                        items?: {
                                          type: "object" | "string" | "number" | "boolean" | "array";
                                          required?: boolean;
                                          properties?: Schema;
                                          items?: {
                                            type: "object" | "string" | "number" | "boolean" | "array";
                                            required?: boolean;
                                            properties?: Schema;
                                            items?: {
                                              type: "object" | "string" | "number" | "boolean" | "array";
                                              required?: boolean;
                                              properties?: Schema;
                                              items?: {
                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                required?: boolean;
                                                properties?: Schema;
                                                items?: {
                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                  required?: boolean;
                                                  properties?: Schema;
                                                  items?: {
                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                    required?: boolean;
                                                    properties?: Schema;
                                                    items?: {
                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                      required?: boolean;
                                                      properties?: Schema;
                                                      items?: {
                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                        required?: boolean;
                                                        properties?: Schema;
                                                        items?: {
                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                          required?: boolean;
                                                          properties?: Schema;
                                                          items?: {
                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                            required?: boolean;
                                                            properties?: Schema;
                                                            items?: {
                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                              required?: boolean;
                                                              properties?: Schema;
                                                              items?: {
                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                required?: boolean;
                                                                properties?: Schema;
                                                                items?: {
                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                  required?: boolean;
                                                                  properties?: Schema;
                                                                  items?: {
                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                    required?: boolean;
                                                                    properties?: Schema;
                                                                    items?: {
                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                      required?: boolean;
                                                                      properties?: Schema;
                                                                      items?: {
                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                        required?: boolean;
                                                                        properties?: Schema;
                                                                        items?: {
                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                          required?: boolean;
                                                                          properties?: Schema;
                                                                          items?: {
                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                            required?: boolean;
                                                                            properties?: Schema;
                                                                            items?: {
                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                              required?: boolean;
                                                                              properties?: Schema;
                                                                              items?: {
                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                required?: boolean;
                                                                                properties?: Schema;
                                                                                items?: {
                                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                                  required?: boolean;
                                                                                  properties?: Schema;
                                                                                  items?: {
                                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                                    required?: boolean;
                                                                                    properties?: Schema;
                                                                                    items?: {
                                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                                      required?: boolean;
                                                                                      properties?: Schema;
                                                                                      items?: {
                                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                                        required?: boolean;
                                                                                        properties?: Schema;
                                                                                        items?: {
                                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                                          required?: boolean;
                                                                                          properties?: Schema;
                                                                                          items?: {
                                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                                            required?: boolean;
                                                                                            properties?: Schema;
                                                                                            items?: {
                                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                                              required?: boolean;
                                                                                              properties?: Schema;
                                                                                              items?: {
                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                required?: boolean;
                                                                                                properties?: Schema;
                                                                                                items?: {
                                                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                  required?: boolean;
                                                                                                  properties?: Schema;
                                                                                                  items?: {
                                                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                    required?: boolean;
                                                                                                    properties?: Schema;
                                                                                                    items?: {
                                                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                      required?: boolean;
                                                                                                      properties?: Schema;
                                                                                                      items?: {
                                                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                        required?: boolean;
                                                                                                        properties?: Schema;
                                                                                                        items?: {
                                                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                          required?: boolean;
                                                                                                          properties?: Schema;
                                                                                                          items?: {
                                                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                            required?: boolean;
                                                                                                            properties?: Schema;
                                                                                                            items?: {
                                                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                              required?: boolean;
                                                                                                              properties?: Schema;
                                                                                                              items?: {
                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                required?: boolean;
                                                                                                                properties?: Schema;
                                                                                                                items?: {
                                                                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                  required?: boolean;
                                                                                                                  properties?: Schema;
                                                                                                                  items?: {
                                                                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                    required?: boolean;
                                                                                                                    properties?: Schema;
                                                                                                                    items?: {
                                                                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                      required?: boolean;
                                                                                                                      properties?: Schema;
                                                                                                                      items?: {
                                                                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                        required?: boolean;
                                                                                                                        properties?: Schema;
                                                                                                                        items?: {
                                                                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                          required?: boolean;
                                                                                                                          properties?: Schema;
                                                                                                                          items?: {
                                                                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                            required?: boolean;
                                                                                                                            properties?: Schema;
                                                                                                                            items?: {
                                                                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                              required?: boolean;
                                                                                                                              properties?: Schema;
                                                                                                                              items?: {
                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                required?: boolean;
                                                                                                                                properties?: Schema;
                                                                                                                                items?: {
                                                                                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                  required?: boolean;
                                                                                                                                  properties?: Schema;
                                                                                                                                  items?: {
                                                                                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                    required?: boolean;
                                                                                                                                    properties?: Schema;
                                                                                                                                    items?: {
                                                                                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                      required?: boolean;
                                                                                                                                      properties?: Schema;
                                                                                                                                      items?: {
                                                                                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                        required?: boolean;
                                                                                                                                        properties?: Schema;
                                                                                                                                        items?: {
                                                                                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                          required?: boolean;
                                                                                                                                          properties?: Schema;
                                                                                                                                          items?: {
                                                                                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                            required?: boolean;
                                                                                                                                            properties?: Schema;
                                                                                                                                            items?: {
                                                                                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                              required?: boolean;
                                                                                                                                              properties?: Schema;
                                                                                                                                              items?: {
                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                required?: boolean;
                                                                                                                                                properties?: Schema;
                                                                                                                                                items?: {
                                                                                                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                  required?: boolean;
                                                                                                                                                  properties?: Schema;
                                                                                                                                                  items?: {
                                                                                                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                    required?: boolean;
                                                                                                                                                    properties?: Schema;
                                                                                                                                                    items?: {
                                                                                                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                      required?: boolean;
                                                                                                                                                      properties?: Schema;
                                                                                                                                                      items?: {
                                                                                                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                        required?: boolean;
                                                                                                                                                        properties?: Schema;
                                                                                                                                                        items?: {
                                                                                                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                          required?: boolean;
                                                                                                                                                          properties?: Schema;
                                                                                                                                                          items?: {
                                                                                                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                            required?: boolean;
                                                                                                                                                            properties?: Schema;
                                                                                                                                                            items?: {
                                                                                                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                              required?: boolean;
                                                                                                                                                              properties?: Schema;
                                                                                                                                                              items?: {
                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                required?: boolean;
                                                                                                                                                                properties?: Schema;
                                                                                                                                                                items?: {
                                                                                                                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                  required?: boolean;
                                                                                                                                                                  properties?: Schema;
                                                                                                                                                                  items?: {
                                                                                                                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                    required?: boolean;
                                                                                                                                                                    properties?: Schema;
                                                                                                                                                                    items?: {
                                                                                                                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                      required?: boolean;
                                                                                                                                                                      properties?: Schema;
                                                                                                                                                                      items?: {
                                                                                                                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                        required?: boolean;
                                                                                                                                                                        properties?: Schema;
                                                                                                                                                                        items?: {
                                                                                                                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                          required?: boolean;
                                                                                                                                                                          properties?: Schema;
                                                                                                                                                                          items?: {
                                                                                                                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                            required?: boolean;
                                                                                                                                                                            properties?: Schema;
                                                                                                                                                                            items?: {
                                                                                                                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                              required?: boolean;
                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                              items?: {
                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                required?: boolean;
                                                                                                                                                                                properties?: Schema;
                                                                                                                                                                                items?: {
                                                                                                                                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                  required?: boolean;
                                                                                                                                                                                  properties?: Schema;
                                                                                                                                                                                  items?: {
                                                                                                                                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                    required?: boolean;
                                                                                                                                                                                    properties?: Schema;
                                                                                                                                                                                    items?: {
                                                                                                                                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                      required?: boolean;
                                                                                                                                                                                      properties?: Schema;
                                                                                                                                                                                      items?: {
                                                                                                                                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                        required?: boolean;
                                                                                                                                                                                        properties?: Schema;
                                                                                                                                                                                        items?: {
                                                                                                                                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                          required?: boolean;
                                                                                                                                                                                          properties?: Schema;
                                                                                                                                                                                          items?: {
                                                                                                                                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                            required?: boolean;
                                                                                                                                                                                            properties?: Schema;
                                                                                                                                                                                            items?: {
                                                                                                                                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                              items?: {
                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                required?: boolean;
                                                                                                                                                                                                properties?: Schema;
                                                                                                                                                                                                items?: {
                                                                                                                                                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                  required?: boolean;
                                                                                                                                                                                                  properties?: Schema;
                                                                                                                                                                                                  items?: {
                                                                                                                                                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                    required?: boolean;
                                                                                                                                                                                                    properties?: Schema;
                                                                                                                                                                                                    items?: {
                                                                                                                                                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                      required?: boolean;
                                                                                                                                                                                                      properties?: Schema;
                                                                                                                                                                                                      items?: {
                                                                                                                                                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                        required?: boolean;
                                                                                                                                                                                                        properties?: Schema;
                                                                                                                                                                                                        items?: {
                                                                                                                                                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                          required?: boolean;
                                                                                                                                                                                                          properties?: Schema;
                                                                                                                                                                                                          items?: {
                                                                                                                                                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                            required?: boolean;
                                                                                                                                                                                                            properties?: Schema;
                                                                                                                                                                                                            items?: {
                                                                                                                                                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                required?: boolean;
                                                                                                                                                                                                                properties?: Schema;
                                                                                                                                                                                                                items?: {
                                                                                                                                                                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                  required?: boolean;
                                                                                                                                                                                                                  properties?: Schema;
                                                                                                                                                                                                                  items?: {
                                                                                                                                                                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                    required?: boolean;
                                                                                                                                                                                                                    properties?: Schema;
                                                                                                                                                                                                                    items?: {
                                                                                                                                                                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                      required?: boolean;
                                                                                                                                                                                                                      properties?: Schema;
                                                                                                                                                                                                                      items?: {
                                                                                                                                                                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                        required?: boolean;
                                                                                                                                                                                                                        properties?: Schema;
                                                                                                                                                                                                                        items?: {
                                                                                                                                                                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                          required?: boolean;
                                                                                                                                                                                                                          properties?: Schema;
                                                                                                                                                                                                                          items?: {
                                                                                                                                                                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                            required?: boolean;
                                                                                                                                                                                                                            properties?: Schema;
                                                                                                                                                                                                                            items?: {
                                                                                                                                                                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                required?: boolean;
                                                                                                                                                                                                                                properties?: Schema;
                                                                                                                                                                                                                                items?: {
                                                                                                                                                                                                                                  type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                  required?: boolean;
                                                                                                                                                                                                                                  properties?: Schema;
                                                                                                                                                                                                                                  items?: {
                                                                                                                                                                                                                                    type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                    required?: boolean;
                                                                                                                                                                                                                                    properties?: Schema;
                                                                                                                                                                                                                                    items?: {
                                                                                                                                                                                                                                      type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                      required?: boolean;
                                                                                                                                                                                                                                      properties?: Schema;
                                                                                                                                                                                                                                      items?: {
                                                                                                                                                                                                                                        type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                        required?: boolean;
                                                                                                                                                                                                                                        properties?: Schema;
                                                                                                                                                                                                                                        items?: {
                                                                                                                                                                                                                                          type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                          required?: boolean;
                                                                                                                                                                                                                                          properties?: Schema;
                                                                                                                                                                                                                                          items?: {
                                                                                                                                                                                                                                            type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                            required?: boolean;
                                                                                                                                                                                                                                            properties?: Schema;
                                                                                                                                                                                                                                            items?: {
                                                                                                                                                                                                                                              type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";
                                                                                                                                                                                                                                              required?: boolean;
                                                                                                                                                                                                                                              properties?: Schema;
                                                                                                                                                                                                                                              items?: {
                                                                                                                                                                                                                                                type: "object" | "string" | "number" | "boolean" | "array";