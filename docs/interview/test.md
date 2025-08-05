# 申通快递二面面试总结（2025年8月5日）

## 面试问题与回答整理

### 1. 两分钟自我介绍
*（按实际面试情况作答）*

### 2. 原生JS熟悉程度
*（按实际面试情况作答）*

### 3. Promise和async/await的区别
**回答**：  
async/await是Promise的语法糖，主要解决回调地狱问题，使异步代码更接近同步的书写方式。

### 4. 错误捕获方式
**回答**：
- Promise：使用`.catch()`方法捕获错误
- async/await：使用`try/catch`语法结构捕获错误

### 5. 箭头函数与普通函数的区别
**回答**：
1. 箭头函数没有自己的`this`，继承外层作用域的`this`
2. 不能作为构造函数使用（不能使用`new`）
3. 没有`arguments`对象
4. 没有`prototype`属性

**追问回答**：
- 改变`this`的其他方法：
  1. 使用闭包保存当前`this`（如`const self = this`）
  2. 显式绑定：`call()`, `apply()`, `bind()`
  3. 在React类组件中常用`bind`绑定事件处理函数

### 6. 非侵入式同步错误捕获
**回答**：  
未给出有效解决方案  
**建议方案**：
```javascript
// 全局错误监听
window.addEventListener('error', (event) => {
  console.error('全局捕获:', event.error);
  // 上报错误日志
});
```

### 7. 非侵入式接口错误捕获（不依赖第三方库）
**回答**：  
未给出有效解决方案  
**建议方案**：
```javascript
// 重写原生fetch方法
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch(...args)
    .catch(error => {
      console.error('请求失败:', error);
      // 统一错误处理
    });
};

// 重写XMLHttpRequest
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
  const xhr = new originalXHR();
  const originalSend = xhr.send;
  
  xhr.send = function(...args) {
    this.addEventListener('error', handleError);
    return originalSend.apply(this, args);
  };
  return xhr;
};
```

### 8. 项目优化实践
**项目**：PC端项目优化  
**优化措施**：
1. 包体积从7MB → 4MB：
   - Gzip压缩
   - 代码分割（Code Splitting）
   - CDN托管第三方库
   - Tree Shaking移除无用代码
2. 热更新速度提升50%+：
   - Webpack迁移至Vite架构
   - 利用ES Module原生支持

### 9. 组件封装注意事项
**回答**：
1. 完整的TypeScript类型支持
2. 提供清晰的API文档和示例
3. 支持配置化渲染（如JSON驱动表格）
4. 兼容多种使用方式（JSX/h函数）
5. 提供扩展点（slots/scoped slots）

**追问回答（多项目共用）**：
1. 遵循语义化版本规范（Semantic Versioning）
2. 避免破坏性变更（Breaking Changes）
3. 提供详细的迁移指南
4. 建立组件文档站点

### 10. 微前端与项目管理
**回答**：
- 微前端：暂未实践
- 当前方案：单体仓库独立管理
- 未来考虑：Monorepo架构管理

### 11. 性能优化指标
**回答**：  
未明确回答  
**核心指标**：
- FCP（First Contentful Paint）
- LCP（Largest Contentful Paint）
- FID（First Input Delay）
- CLS（Cumulative Layout Shift）
- TTI（Time to Interactive）

### 12. 用户最关注的性能指标
**回答**：  
图片加载优化实践  
**追问答案**：  
LCP（最大内容渲染时间）是用户感知最明显的指标

### 13. 打包工具熟悉度
**回答**：  
有系统了解过Babel、Webpack等工具，但工作中实践较少

### 14. 移动端字体适配
**回答**：
- 方案：REM布局
- 原理：动态设置根字体大小
- 工程化：PostCSS转换
- **插件名**：postcss-pxtorem

### 15. 数组方法对比
**回答**：
| 特性       | map          | forEach      |
|------------|--------------|--------------|
| 返回值     | 新数组       | undefined    |
| 链式调用   | 支持         | 不支持       |
| 修改原数组 | 不修改       | 可修改元素   |
| 性能       | 略低（需创建新数组） | 略高 |
| **终止循环** | 不可终止 | 不可终止（需用`throw`） |

**终止循环方案**：
```javascript
// 使用some/every代替
arr.some(item => {
  if (condition) return true; // 终止循环
});

// 传统for循环
for (let i = 0; i < arr.length; i++) {
  if (condition) break;
}
```

### 16. 数组判断方法
**回答**：
- `some()`：至少一个元素满足条件
- `every()`：所有元素满足条件
- 补充：`includes()`, `find()`, `findIndex()`

### 17. React API熟悉度
**回答**：  
熟练掌握React核心API

### 18. useRef使用场景
**回答**：
1. 访问DOM节点
2. 存储可变值（不触发重渲染）
3. 解决闭包陷阱（保存最新值）
4. 存储定时器ID等

### 19. 学习方法与知识获取
**回答**：
1. GitHub优质开源项目
2. 技术博客/官方文档
3. 技术交流社群
4. 知识付费课程
5. 行业技术会议

### 20. AI相关技术熟悉度
**回答**：  
正在学习AI相关领域，MCP/ARG等概念尚未深入

---

## 面试总结
本次面试覆盖了前端核心知识点，特别关注：
1. 异步处理与错误捕获机制
2. 性能优化实践与指标
3. 工程化与架构设计能力
4. React深度应用
5. 代码设计思想

**待加强领域**：
- 全局错误处理方案
- 性能监控指标体系
- 微前端架构实践
- 构建工具深度掌握
- AI前沿技术跟踪

建议后续重点深入前端监控体系、性能优化标准化方案及模块化架构设计。