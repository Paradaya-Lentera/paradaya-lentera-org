using System.Net;

namespace paradaya_lentera.Middleware
{
    public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled exception occurred. TraceId: {TraceId}", 
                    context.TraceIdentifier);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            
            var (statusCode, message) = exception switch
            {
                KeyNotFoundException => (HttpStatusCode.NotFound, "Resource not found"),
                UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized access"),
                ArgumentException => (HttpStatusCode.BadRequest, "Invalid request"),
                _ => (HttpStatusCode.InternalServerError, "An error occurred processing your request")
            };

            context.Response.StatusCode = (int)statusCode;

            if (context.Request.Path.StartsWithSegments("/api") || 
                context.Request.Headers.Accept.ToString().Contains("application/json"))
            {
                var response = new
                {
                    error = message,
                    traceId = context.TraceIdentifier
                };
                await context.Response.WriteAsJsonAsync(response);
            }
            else
            {
                context.Response.Redirect($"/Page/Error?traceId={context.TraceIdentifier}");
            }
        }
    }

    public static class GlobalExceptionMiddlewareExtensions
    {
        public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        {
            return app.UseMiddleware<GlobalExceptionMiddleware>();
        }
    }
}
