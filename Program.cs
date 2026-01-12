using paradaya_lentera.Services.Local;
using paradaya_lentera.Services.External;
using paradaya_lentera.Data;
using paradaya_lentera.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddMemoryCache();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<IReadingListService, ReadingListService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
// Register the concrete OpenLibraryService (inner service)
builder.Services.AddHttpClient<OpenLibraryService>();

// Register CachedSearchService as ICachedSearchService (for legacy/specific references)
// and as IOpenLibraryService (to act as a caching decorator)
builder.Services.AddScoped<ICachedSearchService, CachedSearchService>();
builder.Services.AddScoped<IOpenLibraryService>(sp => sp.GetRequiredService<ICachedSearchService>());

const int authCookieExpirationDays = 7;
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Auth/Login";
        options.LogoutPath = "/Auth/Logout";
        options.AccessDeniedPath = "/Unauthorized/Index";
        options.ExpireTimeSpan = TimeSpan.FromDays(authCookieExpirationDays);
        options.SlidingExpiration = true;
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    });

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await DbSeeder.SeedAsync(context, userService, logger);
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Page/Error");
    app.UseHsts();
}

app.UseGlobalExceptionHandler();

app.UseHttpsRedirection();

// Configure static files with proper caching headers
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Cache static files for 1 day in production, but allow revalidation
        if (!app.Environment.IsDevelopment())
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=86400,must-revalidate");
        }
    }
});

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Page}/{action=Index}/{id?}");

app.Run();