# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "URL Shortener" [level=1] [ref=e5]
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Enter Long URL
        - textbox "Enter Long URL" [ref=e11]: https://example.com
      - button "Create Short URL" [ref=e13]
      - generic [ref=e15]: Failed to create short URL. Please try again.
  - generic [ref=e20] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e21] [cursor=pointer]:
      - img [ref=e22] [cursor=pointer]
    - generic [ref=e25] [cursor=pointer]:
      - button "Open issues overlay" [ref=e26] [cursor=pointer]:
        - generic [ref=e27] [cursor=pointer]:
          - generic [ref=e28] [cursor=pointer]: "0"
          - generic [ref=e29] [cursor=pointer]: "1"
        - generic [ref=e30] [cursor=pointer]: Issue
      - button "Collapse issues badge" [ref=e31] [cursor=pointer]:
        - img [ref=e32] [cursor=pointer]
  - alert [ref=e34]
```