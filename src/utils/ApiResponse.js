class ApiResponse {
  constructor(starusCode, data, message = "Success") {
    this.starusCode = starusCode;
    this.data = data;
    this.message = message;
    this.success = starusCode < 400;
  }
}

export { ApiResponse };
