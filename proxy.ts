export { default as proxy } from "next-auth/middleware";

export const config = {
  matcher: ["/history", "/admin/users"]
};
