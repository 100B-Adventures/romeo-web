# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# 공개 허용목록은 Next.js 빌드 시 브라우저 번들에 고정된다.
#
# 2026-09-12 정정: 예전에는 운영에서 이 값이 비면 빌드를 실패시켰다. 그 전제는
# "운영에는 본인확인이 반드시 살아 있다" 였는데 사실이 아니다. 대행사 계약 전까지
# 운영은 폐쇄형 제공자(UnavailableIdvProvider)로 본인확인 기능만 닫고 돈다.
#
# 그리고 목록이 비어 있는 상태는 위험한 쪽이 아니라 **안전한 쪽**이다.
# trustedIdentityHandoff(src/lib/identityVerification.ts)가 허용목록에 없는 호스트를
# 전부 거절하므로, 빈 목록이면 외부 창을 아무 데도 열지 않는다.
#
# ★이 검사는 워크플로(deploy-v2.yml)와 이 Dockerfile 두 곳에 있었다. 2026-09-12 에
# 워크플로만 고치고 여기를 놓쳐 운영 배포가 또 실패했고, 배포 절차가 컨테이너를 먼저
# 내리기 때문에 운영이 그대로 502 가 됐다. 같은 규칙은 두 곳을 함께 고쳐야 한다.
ARG BUILD_ENV=prod
ENV BUILD_ENV=${BUILD_ENV}
ARG NEXT_PUBLIC_IDV_ALLOWED_HOSTS
RUN if ! printf '%s' "$NEXT_PUBLIC_IDV_ALLOWED_HOSTS" | tr -d '[:space:],' | grep -q .; then \
      echo "WARNING: NEXT_PUBLIC_IDV_ALLOWED_HOSTS is empty for $BUILD_ENV; identity handoff stays fail-closed (opens no external window)" >&2; \
    fi

# Next.js SWC 네이티브 바이너리가 alpine(musl)에서 glibc 로더(ld-linux-x86-64.so.2)를 못 찾아
# "Failed to load SWC binary"로 yarn build가 깨지던 문제 수정 (2026-06-26 prod ~30h 다운 근본원인).
# Next.js 공식 권장: alpine엔 libc6-compat 설치 → glibc 호환 셰임 제공.
RUN apk add --no-cache libc6-compat

# Copy package files
# 2026-09-07: yarn.lock 에서 package-lock.json 으로 전환했다.
# 잠금 파일이 둘이었고 서로 다른 버전을 가리켰다. yarn.lock 은 프레임워크 14.2.0 에
# 박제돼 있었고 package-lock.json 만 보안 상승분 14.2.35 를 담고 있었다.
# 이미지가 yarn 으로 설치하는 한 그 상승분은 배포본에 영원히 반영되지 않는다.
# 잠금 파일을 하나로 수렴시키고 설치 도구도 그쪽으로 맞춘다.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_TOSS_CLIENT_KEY
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_TOSS_CLIENT_KEY=${NEXT_PUBLIC_TOSS_CLIENT_KEY}
ENV NEXT_PUBLIC_IDV_ALLOWED_HOSTS=${NEXT_PUBLIC_IDV_ALLOWED_HOSTS}
ENV NODE_OPTIONS="--max-old-space-size=768"

RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ARG BUILD_ENV=prod
ENV BUILD_ENV=${BUILD_ENV}

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy public folder (favicons, etc.)
COPY --from=builder /app/public ./public

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
