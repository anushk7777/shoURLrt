import '@testing-library/jest-dom';

// Polyfill for Request and Response in Node.js environment
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input: any, init: any = {}) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers)
      this.body = init.body
      this._bodyInit = init.body
    }

    async json() {
      if (this._bodyInit) {
        return JSON.parse(this._bodyInit)
      }
      return {}
    }

    async text() {
      return this._bodyInit || ''
    }
  } as any
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body: any, init: any = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Headers(init.headers)
      this.ok = this.status >= 200 && this.status < 300
    }

    async json() {
      return JSON.parse(this.body)
    }

    async text() {
      return this.body
    }

    static json(data: any, init: any = {}) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers
        }
      })
    }
  } as any
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    _headers: Record<string, string> = {}
    
    constructor(init: any = {}) {
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.set(key, value as string)
        })
      }
    }

    get(name: string) {
      return this._headers[name.toLowerCase()]
    }

    set(name: string, value: string) {
      this._headers[name.toLowerCase()] = String(value)
    }

    has(name: string) {
      return name.toLowerCase() in this._headers
    }

    delete(name: string) {
      delete this._headers[name.toLowerCase()]
    }

    *[Symbol.iterator]() {
      for (const [key, value] of Object.entries(this._headers)) {
        yield [key, value]
      }
    }
  } as any
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Suppress console warnings during tests
const originalWarn = console.warn
const originalError = console.error

beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }

  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error: Not implemented'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
  console.error = originalError
})