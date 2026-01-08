using System.Security.Claims;

namespace paradaya_lentera.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static int GetUserId(this ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
                return 0;

            return int.Parse(userIdClaim.Value);
        }
    }
}