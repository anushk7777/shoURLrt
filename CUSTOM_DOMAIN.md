# Custom Domain Configuration

This URL shortener now supports custom domains instead of using localhost URLs.

## How It Works

- **Development**: Uses `http://localhost:3000` for local testing
- **Production**: Uses your custom domain with HTTPS

## Configuration

### Option 1: Environment Variable (Recommended)

Add or modify the `CUSTOM_DOMAIN` variable in your `.env.local` file:

```env
CUSTOM_DOMAIN=yourdomain.com
```

### Option 2: Default Domain

If no `CUSTOM_DOMAIN` is set, it defaults to `shrtnd.xyz`

## Examples

### Current Configuration
```env
CUSTOM_DOMAIN=shrtnd.xyz
```

**Generated URLs:**
- Development: `http://localhost:3000/abc123`
- Production: `https://shrtnd.xyz/abc123`

### Custom Domain Example
```env
CUSTOM_DOMAIN=mysite.com
```

**Generated URLs:**
- Development: `http://localhost:3000/abc123`
- Production: `https://mysite.com/abc123`

## Important Notes

1. **Domain Only**: Don't include `http://` or `https://` in the `CUSTOM_DOMAIN` value
2. **HTTPS**: Production URLs automatically use HTTPS
3. **DNS Setup**: Make sure your custom domain points to your deployment
4. **SSL Certificate**: Ensure your domain has a valid SSL certificate for HTTPS

## Testing

To test the custom domain functionality:

1. Update `CUSTOM_DOMAIN` in `.env.local`
2. Restart your development server
3. Create a shortened URL
4. The generated URL will use your custom domain format

## Deployment

When deploying to production:

1. Set the `CUSTOM_DOMAIN` environment variable in your hosting platform
2. Configure your domain's DNS to point to your deployment
3. Ensure SSL/TLS is properly configured
4. Test the shortened URLs to verify they work correctly