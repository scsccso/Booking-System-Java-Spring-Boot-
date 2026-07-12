# 企业级分时工位与会议室分时预约系统 (FlexiSpace MVP)

## 1. 项目定位与技术全景

**FlexiSpace MVP** 是一款面向现代化混合办公模式（Hybrid Work）的轻量级、高并发分时预约系统。本系统摒弃了臃肿的第三方中间件，通过深度挖掘底层框架特性，在**零外部服务依赖（无 Redis、无 MQ）**的极简架构下，实现了商业级的实时数据同步与金融级的并发事务一致性。

### 核心技术栈
- **后端架构**：Spring Boot 3.x, Spring Data JPA (Hibernate), H2 Database
- **实时通信**：原生 Server-Sent Events (SSE), Spring ApplicationEvents
- **安全鉴权**：原生 JWT 拦截器 (io.jsonwebtoken:jjwt), 双端防越权路由隔离
- **前端生态**：React 18 (Hooks 架构), Vite, Tailwind CSS, Axios, Lucide React

---

## 2. 双端功能矩阵与交互剖析

系统严格践行 User/Admin 权限隔离，双端具备完全独立的宿主布局与业务规则引擎：

| 模块 | 面向群体 | 核心功能与商业级交互设计 |
| :--- | :--- | :--- |
| **智能控制台** | 普通用户 (User) | **7天智能滑块日历**：通过 `bookings` 密度比动态演算状态圆点（红/黄/绿），提供无感容量预警。<br>**富媒体资产卡片**：前端静态配置映射物理元数据（如 `👥 8 人间 · 🖥️ 4K 投影`），降低网络传输冗余。<br>**硬核配额结算**：严格执行“单人单日4小时”聚合上限，余额不足时自动熔断前端提交。<br>**智能行程管理**：提供基于时间锁定的自主取消功能（时段开始后立即禁用销毁入口）。<br>**防御性交互**：全局覆写不可逆操作拦截，强制呼出二次确认模态框 (Modal)。 |
| **管理大盘** | 管理员 (Admin) | **全局调度看板**：实时汇总全资源预定状态与占用率统计。<br>**一键熔断切流**：支持将工位状态平滑切换为 `MAINTENANCE`，并强制释放所有关联订单。<br>**内存级无感交互**：摒弃繁重的后端搜索过滤 API，采用 `useMemo` 结合原生 `Array.sort/filter`，在前端内存实现零网络延迟的实时检索与列级排序。 |

---

## 3. 硬核技术亮点深度解析

本项目拒绝流于表面的 CRUD，重点攻克了高并发防超卖与多终端状态协同两大技术深水区：

### 3.1 零外部依赖的绝对一致性保障 (串行化隔离 + 悲观写锁)
在高并发预约场景中，恶意用户可能通过并发请求绕过每日 4 小时配额限制（即典型的“幻读”问题）。
- **架构方案**：在 `BookingService` 核心写入链路中，联合使用 `@Lock(LockModeType.PESSIMISTIC_WRITE)` 对资源行进行排他锁定，并**强行拉升事务隔离级别至 `@Transactional(isolation = Isolation.SERIALIZABLE)`**。
- **原理解析**：标准的 `REPEATABLE_READ` 无法阻止两个并发事务同时读取到“已预约 3 小时”的聚合结果并分别提交。通过开启 `SERIALIZABLE` 串行化隔离，数据库引擎锁定了聚合查询 (`calculateTotalHoursByUserAndDate`) 覆盖的索引范围，从数学与存储底层彻底根除了幻读与超卖漏网之鱼，实现了金融级的数据绝对一致性。

### 3.2 多终端实时同步演进 (单向广播 + 原子级状态突变)
在不引入 WebSocket 握手开销与 MQ 组件的前提下，系统实现了多端无感协作。
- **单向轻量广播**：后端通过 Spring `ApplicationEventPublisher` 实现业务层解耦，将事务状态推入 `CopyOnWriteArrayList` 维护的 `SseEmitter` 连接池，通过 HTTP/1.1 长连接向客户端下发增量 JSON 荷载。
- **原子突变与闪烁动效 (Flash Highlight)**：前端 `useUserBooking` Hook 拦截到 SSE 推送后，直接在内存中执行局部状态的增量合并与过滤，无需刷新页面。同时，前端精准定位受影响的网格坐标，为其注入持续 1.5 秒的 CSS 关键帧闪烁动效（`animate-flash-red` 抢占 / `animate-flash-green` 释放），完美复现商业级协同软件的实时体感。

### 3.3 网络 Resiliency 与前端容灾机制
- **401 自动熔断回流**：Axios 响应拦截器全局捕获 Token 校验失败，执行原子的 `localStorage` 清理逻辑并强制剥离失效态，将路由重定向至登录门户。
- **5xx 瞬时重试补偿**：针对高并发下偶尔出现的 500/502 瞬态网络抖动，拦截器内嵌了 500ms 延迟的单次自动重试闭包（Auto-Retry），在用户无感知的状态下完成自愈，大幅提升复杂网络环境下的前端鲁棒性。

---

## 4. 快速启动与演示凭证

### 环境启动
请在独立终端分别启动前后端服务：

**Backend (Spring Boot)**
```bash
cd backend
mvn spring-boot:run
```
*(后端运行于 http://localhost:8081)*

**Frontend (React/Vite)**
```bash
cd frontend
npm run dev
```
*(前端运行于 http://localhost:5173)*

### 演示凭证与最佳玩法 (Dual-Browser Testing)
系统在启动时通过 JPA `data.sql` 自动初始化了演示账号：
- **普通用户 (User)**：`user01` / `123456`
- **系统管理员 (Admin)**：`admin01` / `123456`

**🌟 强烈建议的演示流程**：
1. 打开浏览器左半分屏，登录 `user01` 停留在预约网格页。
2. 打开浏览器右半分屏（或使用隐身窗口），访问 `/admin/login` 登录 `admin01`。
3. 在 Admin 界面将某个工位设置为 `Maintenance`，或强制删除一条订单。
4. **观察左侧 User 界面**：您将立刻看到对应的工位格发出绿/红色闪烁动效，并且配额与状态瞬间自动更新，体验无缝的 SSE 实时同步机制！
