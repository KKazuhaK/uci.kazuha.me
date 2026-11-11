---
title: "期中复习"
summary: "第 0–12 讲的期中复习：考试范围与策略、大 O 与循环计数、ArrayList 与均摊分析、链表、由彼此构建的栈/队列/双端队列、四种比较排序、树与遍历、堆与优先队列、二叉搜索树、第 0–2 讲的 C++ 主题，以及样题、测验、作业与实验的解答与可能的变体。"
---

# Information and Computer Science 46 — 期中复习

## 目录

- [1. 考试范围与形式](#1-考试范围与形式)
- [2. 如何应对本次考试](#2-如何应对本次考试)
- [3. 大 O 与增长阶（样题 Q1）](#3-大-o-与增长阶样题-q1)
- [4. 循环与递归计数（样题 Q2）](#4-循环与递归计数样题-q2)
- [5. ArrayList 与均摊分析](#5-arraylist-与均摊分析)
- [6. 链表（样题 Q3）](#6-链表样题-q3)
- [7. 栈、队列与双端队列（样题 Q4）](#7-栈队列与双端队列样题-q4)
- [8. 比较排序（样题 Q5）](#8-比较排序样题-q5)
- [9. 树、二叉树与遍历](#9-树二叉树与遍历)
- [10. 堆与优先队列](#10-堆与优先队列)
- [11. 二叉搜索树](#11-二叉搜索树)
- [12. 堆排序（期中不考）](#12-堆排序期中不考)
- [13. 模板、指针、智能指针、二维数组](#13-模板指针智能指针二维数组)
- [14. 设计题](#14-设计题)
- [15. 必须熟记的实验代码](#15-必须熟记的实验代码)
- [16. 速查与考前清单](#16-速查与考前清单)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh, Fall 2026. 期中考试：11/12/26（周四），课堂进行。
> 整理自样题、Quiz 2–4、HW 1/2/3/5、Lab 1–4、第 12 讲的“期中考试主题与准备”幻灯片，以及第 14 讲（11/10）的课堂复习。每个主题都链接回其讲义笔记以获得完整讲解；本页是其上的考试层。
> 本页所有代码都已用 `g++ -std=c++17 -Wall -Wextra -fsanitize=address,undefined` 编译并运行；打印的结果均为真实输出。

---

## 1. 考试范围与形式

官方主题列表（第 12 讲，幻灯片 3），外加 Prof. Yeh 之后新增的树相关内容：

| 期中考试主题 | 授课位置 |
|---|---|
| 模板、随机性、指针、引用、智能指针、多维数据 | [第 0 讲](lec-00.zh-CN.md)、[第 1 讲](lec-01.zh-CN.md)、[第 2 讲](lec-02.zh-CN.md) |
| 算法分析、ArrayList、链表、循环数组 | [第 2 讲](lec-02.zh-CN.md)、[第 3 讲](lec-03.zh-CN.md)、[第 4 讲](lec-04.zh-CN.md)、[第 7 讲](lec-07.zh-CN.md) |
| 栈、队列、双端队列 | [第 4 讲](lec-04.zh-CN.md)、[第 5 讲](lec-05.zh-CN.md)、[第 7 讲](lec-07.zh-CN.md) |
| 均摊分析、递归分析 | [第 3 讲](lec-03.zh-CN.md)、[第 6 讲](lec-06.zh-CN.md) |
| 基于比较的排序（选择、插入、归并、快速） | [第 7 讲](lec-07.zh-CN.md)、[第 8 讲](lec-08.zh-CN.md)、[第 9 讲](lec-09.zh-CN.md) |
| 树、二叉树、遍历；堆与优先队列；二叉搜索树 | [第 10 讲](lec-10.zh-CN.md)、[第 11 讲](lec-11.zh-CN.md)、第 12 讲（[§9](#9-树二叉树与遍历)–[§11](#11-二叉搜索树)） |

同一张幻灯片列出的复习材料：样题、测验、课堂活动、作业和实验，以及 **“实验中的实现也会考。”**

- **树在考试范围内。** 幻灯片的列表只到排序为止，但 Prof. Yeh 之后表示期中会考树：树的术语与遍历、堆与优先队列（包括自底向上建堆），以及 BST（[§9](#9-树二叉树与遍历)–[§11](#11-二叉搜索树)）。样题中没有树的题目，因此这些章节是基于第 10–12 讲的活动编写的。
- **堆排序不考。** Prof. Yeh 已确认，这与样题的“忽略 Heapsort”一致。其内容保留在本页中并折叠起来（[§12](#12-堆排序期中不考)），供期末使用。
- **形式**（课上宣布）：纸笔自由作答，闭卷，C++ 手写（测验不允许带小抄；除非另行通知，按相同规则准备）。
  - **没有选择题。** 主要是填空、解释和编程题；**给部分分数**。
  - **5 道主题题，每道多个小题，约 10 分**，按主题排列——与样题的形式相同（大 O、循环计数、一个链表方法、由一个结构构建另一个结构、排序）。
  - **一道编程题、一道代码审查题（[§2.7](#27-代码审查题)），以及许多概念题。** 预计要分析函数：运行时间、效率与边界情况。
  - **递归代码的运行时间**可以用**主定理或递归树**来分类——两者都可接受（[§4.3](#43-可以替换-mystery4-的递推式)）。
  - **额外加分题**刻意设计得又长又难：等主要题目做完再做。
- **第 14 讲已复习。** 第 14 讲（11/10）的复习恰好讲解了两道样题：Q3，仅有 tail 的循环 SLL 上的 `removeLast`（[§6.2](#62-样题-q3-解答仅有-tail-的循环-sll-上的-removelast)），以及 Q4，用一个队列实现栈（[§7.2](#72-样题-q4-解答用一个队列实现栈)）。两题及其变体都要烂熟于心。
- **样题就是蓝本。** 预计五道题的类型相同，但细节会改变——例如换成 `removeFirst` 而非 `removeLast`，换成 head 指针而非 tail，输入换成逆序而非已排序。下面各节都先解答样题，再解答最可能取代它的变体。

---

## 2. 如何应对本次考试

### 2.1 先写下假设

题目有时会留下一些细节未说明（允许重复吗？列表可以为空吗？能否新增成员变量？）。不要默默猜测——写一行假设，并在其下作答：

> *假设：列表可以为空；在空列表上调用 `removeLast()` 会抛出 `std::underflow_error`。*

一个明确且合理的假设，能把“含糊”变成“已回答”。当评分标准预期某个特定情况时，它也能保护你：说明你已经注意到了这一点。

### 2.2 下笔前先找出变化的细节

每道题读两遍，并划出与你练习过的版本不同的那一点：head 与 tail 指针、front 与 rear、最坏与均摊、一个队列还是两个、已排序还是逆序输入。修改题目丢分，大多是因为照着原题作答。

样题本身有些粗糙之处，不要被它们干扰：Q3 把类名写成 `CircularLinkedList<Item>`，但头文件中是 `SinglyLinkedList<T>::removeLast()`，并且声明了 `Node tail;`（Java 风格），而 C++ 需要的是 `Node* tail;`；Q2 说“五个 mystery 方法”，却只列出了四个。Q4 中有 `Public:`、`boolean` 和 `Stack() = default:`。请写出正确的 C++，如果某处很重要，就注明你是如何理解的。

### 2.3 每个复杂度答案都要有“因为”

在一行内同时写出界与理由，并指明情形：

- ❌ “O(n)”
- ✅ “最坏情况 O(n)：要删除最后一个节点，必须先找到它的前驱，这需要从前端走 n − 1 个节点。”

书面推理是在界错误时仍能拿到部分分数的依据，也是阅卷人唯一能看到的东西。

### 2.4 手写的 C++ 按 C++ 评分

- 指针：`Node* p`、`p->next`、`nullptr`（不要写 `null`，也不要写 `p.next`）。
- 类外的成员定义：先写 `template <typename T>`，再写 `T CircularLinkedList<T>::removeLast() { … }`。
- 释放你摘下的节点（`delete old;`），并且在 `delete` **之前**先把元素复制出来。
- 每条路径都要有返回值；对空结构抛出异常（`throw std::underflow_error("...");`）。

### 2.5 特殊情况检查表

在编写任何链式结构或数组方法之前，先逐项检查下表，并处理（或排除）每一种情况：

| 情况 | 典型处理 |
|---|---|
| 空 | 抛出异常，或在第一次插入时同时设置两端 |
| 恰好一个元素 | 删除后，**head 和 tail 都**变为 `nullptr` |
| 在第一个 / 最后一个位置操作 | 更新 `head` / `tail` |
| 数组已满 | 扩容（翻倍），按**逻辑**顺序复制 |
| 环绕 | `(i + 1) % cap`、`(i - 1 + cap) % cap` |

### 2.6 时间分配

- 试卷很长。先做你已经反复练习过的题型（大 O 表、循环计数、排序表），再写代码。
- 第一遍先跳过额外加分题；只有在所有主要题目都有答案后再回来做。
- 预计会有一道较难的设计类题目（[§14](#14-设计题)）。要为它留出时间；如果卡住，就写下思路、不变式和你的目标复杂度——仅此一项就值得拿分。
- 留意考试中宣布的更正。
- 近期内容也会出现：确保树、堆与 BST（[§9](#9-树二叉树与遍历)–[§11](#11-二叉搜索树)）掌握扎实，而不只是早期讲次。

Prof. Yeh 在 Ed 上给出的备考建议：务必能完成**每一个课堂活动和作业题及其变体**，并复习实验；评估考察的是理解的深度。

### 2.7 代码审查题

你会拿到一段代码（通常是课程中某个结构的一个方法），并被问它哪里有问题或质量如何。每次都按同一张清单逐项检查，每个发现写一行——什么会出错、在哪个输入上出错、以及如何修复：

| 检查项 | 要找什么 |
|---|---|
| 正确性 | 循环边界错误（差一）、指针更新的顺序错误、移动方向错误、对负数使用 `%` |
| 边界情况 | 空结构、只有一个元素、在前端/后端操作、数组已满、环绕（[§2.5](#25-特殊情况检查表)） |
| 内存 | 缺少 `delete`（泄漏）、`delete` 之后仍使用节点（悬空指针）、释放后仍读取元素 |
| 运行时间与效率 | 循环内调用 O(n) 操作（整体 O(n²)）、每次按固定量扩容、每次调用都重复计算 |
| 约定 | 是否保持不变式（BST 顺序、堆序、`count`、`tail`）？返回值是否正确？ |

练习：每段代码片段至少有一个 bug。

**(a)** ArrayList 的 `add(index, item)`：

```cpp
for (size_t i = index; i < n_; ++i)
    data_[i + 1] = data_[i];
data_[index] = item;
++n_;
```

<details>
<summary>解答</summary>

它从前往后移动，因此 `data_[index]` 被复制到之后的每个位置，其他元素都被覆盖。应从末尾开始移动：`for (size_t i = n_; i > index; --i) data_[i] = data_[i - 1];`。它还从不检查 `n_ == capacity_`（在写入 `data_[n_]` 之前应先调用 `expand()`），也不检查 `index <= n_`。

</details>

**(b)** 带 `head` 和 `tail` 的 SLL 上的 `removeLast`：

```cpp
T removeLast() {
    Node* p = head;
    while (p->next != tail) p = p->next;
    T item = tail->item;
    delete tail;
    tail = p;
    return item;
}
```

<details>
<summary>解答</summary>

共三个 bug。(1) 空链表：`p` 为 `nullptr`，`p->next` 会崩溃——应先抛出异常。(2) 只有一个节点：`head == tail`，循环会越过末尾（`p->next` 为 `nullptr`，永远不等于 `tail`）——应同时把 `head` 和 `tail` 设为 `nullptr`。(3) 新的 tail 仍指向已删除的节点：添加 `p->next = nullptr;`。按设计它也是 O(n)；只有双向链表（DLL）才能做到 O(1)。

</details>

**(c)** 双栈队列的 `dequeue`：

```cpp
T dequeue() {
    while (!stackIn.isEmpty())
        stackOut.push(stackIn.pop());
    return stackOut.pop();
}
```

<details>
<summary>解答</summary>

即使 `stackOut` 中仍有元素，它也会转移，因此较新的元素会压在较旧的元素之上，破坏 FIFO 顺序（入队 1、2；出队 → 1；入队 3；出队 → 3，但应为 2）。应只在 `if (stackOut.isEmpty())` 时转移，并且两个栈都为空时抛出异常。

</details>

**(d)** 循环数组上的双端队列，在前端插入（`front`、`count` 和 `capacity` 都是 `int`）：

```cpp
void pushFront(const T& x) {
    front = (front - 1) % capacity;
    data[front] = x;
    count++;
}
```

<details>
<summary>解答</summary>

当 `front` 为 0 时，在 C++ 中 `(0 - 1) % capacity` 的结果是 −1（`%` 保留符号），于是写入了 `data[-1]`。应使用 `(front - 1 + capacity) % capacity`。它也从不检查 `count == capacity`（应先扩容，从 `front` 处展开）。

</details>

**(e)** BST 插入：

```cpp
void put(Node* x, const Key& key, const Value& val) {
    if (x == nullptr) { x = new Node(key, val, 1); return; }
    if (key < x->key) put(x->left, key, val);
    else if (key > x->key) put(x->right, key, val);
    else x->val = val;
}
```

<details>
<summary>解答</summary>

`x` 只是指针的副本，因此新节点被赋值给局部变量，从未挂接到树上（并且泄漏）。应返回子树根并重新赋值——如幻灯片代码所示 `x->left = put(x->left, key, val);`（[§11](#11-二叉搜索树)）——或者把参数改为 `Node*& x`。`size` 字段也从未更新。

</details>

**(f)** 对链表求和（效率）：

```cpp
int sum = 0;
for (size_t i = 0; i < list.size(); i++)
    sum += list.get(i);
```

<details>
<summary>解答</summary>

结果正确，但链表上的 `get(i)` 要走 i 个节点，因此循环的代价为 0 + 1 + ⋯ + (n − 1) = O(n²)。应只遍历一次节点（`for (Node* p = head; p != nullptr; p = p->next) sum += p->item;`，或使用迭代器），得到 O(n)。在 ArrayList 上同样的循环是 O(n)。

</details>

---

## 3. 大 O 与增长阶（样题 Q1）

**规则。** 保留增长最快的项，去掉其常数系数；常数（即使是 2¹²）是 O(1)；对数的底数无关紧要（log₂ n 与 log₁₀ n 只相差一个常数），但指数的底数有关（3ⁿ 不是 O(2ⁿ)）。O = 上界，Ω = 下界，Θ = 两者兼有（[第 3 讲](lec-03.zh-CN.md#2-渐近分析big-obig-ωbig-θ)）。

**阶梯**（请记熟）：1 < log n < √n < n < n log n < n² < n³ < 2ⁿ < n! < nⁿ。

### 3.1 样题 Q1 解答

| f(n) | 大 O |
|---|---|
| 2ⁿ | O(2ⁿ) |
| n²/2 + 1000 n log n | O(n²) |
| 50 n log n + n! | O(n!) |
| 30n | O(n) |
| 3 n log n + 1000n | O(n log n) |
| n³ + 50n² + 1000 | O(n³) |
| 2 log n + 47 | O(log n) |
| 2¹² | O(1) |

**(b) 递增顺序：** 2¹² → 2 log n + 47 → 30n → 3n log n + 1000n → n²/2 + 1000 n log n → n³ + 50n² + 1000 → 2ⁿ → 50 n log n + n!，即 1 < log n < n < n log n < n² < n³ < 2ⁿ < n!。

> ⚠️ **易错点**：(b) 小问排序的是*答案*（大 O 类），而不是原始函数——并且不要让较大的常数（1000n）把某一项推到阶梯的更高处。

### 3.2 变体

| f(n) | 答案 | 原因 |
|---|---|---|
| log(n²) | O(log n) | = 2 log n |
| (log n)² | O((log n)²) | 增长快于 log n，慢于 n |
| n log n + n^1.5 | O(n^1.5) | n^1.5 / (n log n) = √n / log n → ∞ |
| 2ⁿ⁺¹ | O(2ⁿ) | = 2 · 2ⁿ |
| 2²ⁿ | O(4ⁿ) | = (2²)ⁿ —— **不是** O(2ⁿ) |
| n + n/2 + n/4 + … + 1 | O(n) | 等比级数，≤ 2n（Quiz 2） |
| 1 + 2 + … + n | O(n²) | n(n+1)/2 |
| 1 + ½ + ⅓ + … + 1/n | O(log n) | 调和级数 |
| 2ⁿ + n¹⁰ + n log n | O(2ⁿ) | Quiz 2 |
| nlogn + n² + 2¹⁰⁰⁰ | O(n²) | Quiz 2：常数仍是 O(1) |

**HW 2 —— 当 n 翻倍时会发生什么？** T(2n)/T(n) 是该复杂度类的“指纹”：

| 类别 | n → 2n 时间乘以 |
|---|---|
| O(1) | 1 |
| O(log n) | 增加一个常数（log 2n = log n + 1） |
| O(n) | 2 |
| O(n log n) | 略大于 2 |
| O(n²) | 4 |
| O(n³) | 8 |
| O(2ⁿ) | 平方（2²ⁿ = (2ⁿ)²） |

经验方法（[第 2 讲](lec-02.zh-CN.md#53-倍增假设)）：比值 ≈ 2ᵇ，因此 b = log₂(比值)；例如 1.0 s → 8.1 s 意味着 b ≈ 3。

---

## 4. 循环与递归计数（样题 Q2）

**方法。** 对于循环，根据循环变量的起始值、步长和终止条件计算迭代次数。对于嵌套循环，把每个外层取值下的内层次数加起来（内层次数可能依赖外层变量）。对于递归，写出 T(n) = （递归调用次数）+ （非递归部分的工作量），然后求解（[第 6 讲](lec-06.zh-CN.md)）。

### 4.1 样题 Q2 解答

| 方法 | `method()` 的精确调用次数 | 大 O | 实测（n = 1000） |
|---|---|---|---|
| `mystery1`：`i = 0; i < 2*n; i++` | 2n | O(n) | 2000 |
| `mystery2`：`i = 1; i < n; i = i*2` | ⌈log₂ n⌉（i = 1, 2, 4, …，< n） | O(log n) | 10 |
| `mystery3`：`i = 1; while (i < n*n) i++` | n² − 1 | O(n²) | 999,999 |
| `mystery4`：递归 `n * mystery4(n-1)` | 不调用 `method()`；它自己递归调用 n + 1 次 | O(n) | n = 20 时 21 次调用 |

对于 `mystery4`：T(n) = T(n − 1) + c，T(0) = c，因此 T(n) = c(n + 1) = O(n)。它还使用 O(n) 的**栈空间**（最深处同时存活 n + 1 个栈帧）。

> 💡 **关键洞见**：“`i = i * 2`”意味着 log₂ n，“`i < n * n`”意味着 n²，而没有循环的递归函数不是 O(1) —— 要数调用次数。

### 4.2 可以替换它们的循环模式

n = 1024 时的实测次数：

| 代码 | 次数 | 大 O |
|---|---|---|
| `for (i = 1; i < n; i *= 3)` | log₃ n（7） | O(log n) |
| `for (i = n; i > 1; i /= 2)` | log₂ n | O(log n) |
| `for (i = 1; i < n; i += 10)`（Lab 2） | n/10（103） | O(n) |
| `for (i = 1; i * i < n; i++)` | √n（31） | O(√n) |
| `for (i = 0; i < n; i++) for (j = 0; j < i; j++)` | n(n−1)/2（523,776） | O(n²) |
| `for (i = 0; i < n; i++) for (k = n; k > 1; k /= 2)` | n log₂ n（10,240） | O(n log n) |
| `for (i = 1; i < n; i *= 2) for (j = 0; j < i; j++)` | 1 + 2 + 4 + … < 2n（1023） | **O(n)** |
| `for (i = 0; i < 10000; i++) for (k = 1; k < n; k *= 2)`（Quiz 2） | 10000 · log₂ n | O(log n) |

> ⚠️ **易错点**：外层按倍增、内层上限为 `i` 的循环看起来像 n log n，但内层次数是 1、2、4、……，是一个以 2n 为界的等比数列。另外，常数上界（10000）的循环只是一个常数因子，而不是 n。

### 4.3 可以替换 `mystery4` 的递推式

| 递推式 | 例子 | 解 |
|---|---|---|
| T(n) = T(n−1) + c | 阶乘、列表求和 | O(n) |
| T(n) = T(n−1) + n | 递归选择排序 | O(n²) |
| T(n) = 2T(n−1) + c | `f(n-1) + f(n-1)`（类斐波那契的朴素递归） | O(2ⁿ)（1, 3, 7, 15, … = 2ⁿ⁺¹ − 1） |
| T(n) = T(n/2) + c | 二分查找 | O(log n) |
| T(n) = 2T(n/2) + c | 访问两半，O(1) 的工作 | O(n) |
| T(n) = 2T(n/2) + n | 归并排序 | O(n log n) |
| T(n) = T(n/2) + n | 折半并扫描 | O(n) |

对 T(n) = aT(n/b) + O(nᵈ) 使用**主定理**：比较 a 与 bᵈ —— 相等 → O(nᵈ log n)；a < bᵈ → O(nᵈ)；a > bᵈ → O(n^(log_b a))。它**不**适用于 T(n − 1) 形式的递推；这类递推要画出递归树（[第 6 讲](lec-06.zh-CN.md#7-方法-b主定理)）。

**递归树**（考试中可代替主定理使用）：每次调用画一个节点，节点内写出递归调用*之外*所做的工作，把每一层加起来，再把各层相加。

| 递推式 | 第 k 层 | 层数 | 总计 |
|---|---|---|---|
| 2T(n/2) + n（归并排序） | 2ᵏ 次调用 × n/2ᵏ = n | log₂ n | n log n |
| T(n/2) + n | 1 次调用 × n/2ᵏ | log₂ n | n + n/2 + ⋯ ≤ 2n = O(n) |
| 2T(n/2) + 1 | 2ᵏ 次调用 × 1 | log₂ n | 1 + 2 + ⋯ + n ≈ 2n = O(n) |
| T(n − 1) + n | 1 次调用 × (n − k) | n | n + (n − 1) + ⋯ + 1 = O(n²) |
| 2T(n − 1) + 1 | 2ᵏ 次调用 × 1 | n | 1 + 2 + ⋯ + 2ⁿ⁻¹ = 2ⁿ − 1 = O(2ⁿ) |

在答案中写出每层的和以及层数——这正是部分分数的依据。

---

## 5. ArrayList 与均摊分析

**三个组成部分**（HW 2）：指向堆上数组的指针（`T* data`）、**size** n（已存放的元素个数）、**capacity**（已分配的槽位数）。在检查 `i < n` 之后，访问 `data[i]` 为 O(1)。

**当 size == capacity 时添加**（HW 2，例如 size 为 8、capacity 为 8）：分配一个容量为 16 的新数组，复制 8 个元素，`delete[]` 旧数组，让 `data` 指向新数组，把 capacity 设为 16，然后在下标 8 处存入元素并把 size 变为 9。这次 `add` 的代价是 O(n)；接下来的 7 次各为 O(1)。

### 5.1 成本（Quiz 2 询问了最好与最坏）

| 操作 | 最好 | 最坏 | 均摊 |
|---|---|---|---|
| `get(i)` / `set(i, x)` | O(1) | O(1) | —— |
| 在末尾 `add(x)` | O(1) | O(n)（扩容） | 倍增时为 **O(1)** |
| 从末尾 `remove()` | O(1) | O(n)（缩容） | **O(1)** |
| 在前端 `add(0, x)` | O(n) | O(n) | O(n) —— 总要移动全部 n 个元素 |
| `add(i, x)` / `remove(i)` | 在末尾时 O(1) | O(n) | —— |

> ⚠️ **易错点**：“从尾部删除”的最好 O(1) 与最坏 O(n) 只是因为缩容；“在前端添加”只要列表非空就是 O(n) —— 每个元素都要移动（Quiz 2 的答案也接受空列表时最好情况 O(1)）。

### 5.2 扩容策略的均摊代价（Quiz 2）

规则：**按常数倍数增长或缩小** → 每次扩容的 O(n) 复制，由它之前的 Θ(n) 次廉价操作来支付 → 均摊 O(1)。**按常数量增长或缩小** → 每 k 次操作复制一次 → 总代价 1 + (k+1) + (2k+1) + … = Θ(n²)（对 n 次添加而言）→ 均摊 **O(n)**。

| 策略 | 每次操作的均摊代价 |
|---|---|
| 满时 capacity × 2 | O(1) |
| 满时 capacity × 3 | O(1) |
| 满时 capacity + 1（[第 3 讲](lec-03.zh-CN.md#73-翻倍与每次只增加-1幻灯片-4044)） | O(n) |
| 满时 capacity + 3（或 + 1000） | O(n) |
| 占用 ¼ 时减半 | O(1) |
| 占用 ¼ 时缩小 100 | O(n) |

> 💡 **关键洞见**：在占用 **¼** 时缩容，而不是 ½。在占用一半时就缩容，会使边界处的一对 add/remove 每次都触发扩缩容（抖动，每次 O(n)）。

你必须能写出的 Lab 2 代码（`add(index)`、`remove(index)`、`expand`、`shrink`）就是 [第 3 讲的完整实现](lec-03.zh-CN.md#8-完整实现)。需要做对的两个循环：

```cpp
for (size_t i = n_; i > index; --i) data_[i] = data_[i - 1];      // add: shift right, from the end
for (size_t i = index; i + 1 < n_; ++i) data_[i] = data_[i + 1];  // remove: shift left, from index
```

> ⚠️ **易错点**：右移必须从**末尾**开始（否则会覆盖你仍需要的元素）；并且在使用 `size_t` 时，形如 `for (i = n - 1; i >= index; --i)` 的循环在 `index` 为 0 时永远不会结束。

---

## 6. 链表（样题 Q3）

### 6.1 成本表 —— 测验中被问得最多的事实

| 操作 | SLL（head） | SLL（head + tail） | DLL（head + tail） | 循环 SLL（仅 tail） |
|---|---|---|---|---|
| add first | O(1) | O(1) | O(1) | O(1) |
| add last | O(n) | O(1) | O(1) | O(1) |
| remove first | O(1) | O(1) | O(1) | O(1) |
| remove last | O(n) | **O(n)** | O(1) | **O(n)** |
| get(i) / add(i) / remove(i) | O(n) | O(n) | O(n)（从较近的一端） | O(n) |

> 💡 **关键洞见**：tail 指针让你能在 O(1) 时**在最后一个节点之后添加**，但在单链表中无法在 O(1) 时**删除**它：删除需要前驱节点，而只有 `prev` 指针（DLL）才能不经遍历直接找到它。

### 6.2 样题 Q3 解答：仅有 `tail` 的循环 SLL 上的 `removeLast`

链表为 `12 → 99 → 37 →`（回到 12），`tail` 指向 37；`tail->next` 是第一个节点。

**(a) 特殊情况。**
1. **空链表**（`tail == nullptr`）：没有可删除的内容 —— 抛出异常。
2. **只有一个节点**（`tail->next == tail`）：删除之后链表为空，因此 `tail = nullptr`。
3. **一般情况**：从第一个节点出发，走到其 `next` 指向 `tail` 的节点（前驱），然后做两步指针更新：`prev->next = tail->next;` 和 `tail = prev;`。

**(b) 代码。**

```cpp
// Assumption: Node is { T item; Node* next; }, members Node* tail; int count;
template <typename T>
T CircularLinkedList<T>::removeLast() {
    if (tail == nullptr)
        throw std::underflow_error("removeLast on empty list");
    Node* old = tail;
    T item = old->item;
    if (tail->next == tail) {               // only one node
        tail = nullptr;
    } else {
        Node* prev = tail->next;            // start at the first node
        while (prev->next != tail)
            prev = prev->next;
        prev->next = tail->next;            // predecessor now points to the first node
        tail = prev;
    }
    delete old;
    count--;
    return item;
}
```

测试运行（依次用 `addLast` 加入 12、99、37）：

```text
12 99 37 (count 3)
removeLast -> 37  12 99 (count 2)
```

**(c) 复杂度。** **O(n)**：走到前驱节点要访问 n − 1 个节点。若改用 **head** 指针，仍然是 **O(n)**：同样要走到最后一个节点的前驱（而且只有 `head` 时还得先走到最后一个节点本身）。只有给每个节点都加上 `prev` 指针，才能达到 O(1)（Quiz 2 的答案）。

> ⚠️ **易错点**：在循环链表中没有 `nullptr` 可以作为停止条件。写成 `while (p->next != nullptr)` 的循环永远不会结束 —— 应当停在 `tail` 处。

### 6.3 同一链表上的变体

全部见 [编译后的代码](#152-代码库已编译)；只使用 `tail`：

```cpp
void addLast(const T& item) {                    // O(1)
    Node* node = new Node{item, nullptr};
    if (tail == nullptr) node->next = node;      // a single node points to itself
    else { node->next = tail->next; tail->next = node; }
    tail = node;
    count++;
}
void addFirst(const T& item) {                   // O(1): same splice, but tail stays
    Node* node = new Node{item, nullptr};
    if (tail == nullptr) { node->next = node; tail = node; }
    else { node->next = tail->next; tail->next = node; }
    count++;
}
T removeFirst() {                                // O(1)
    if (tail == nullptr) throw std::underflow_error("removeFirst on empty list");
    Node* first = tail->next;
    T item = first->item;
    if (first == tail) tail = nullptr;           // it was the only node
    else tail->next = first->next;
    delete first;
    count--;
    return item;
}
```

| 变体问题 | 答案 |
|---|---|
| 循环 SLL，仅 tail：addFirst / addLast / removeFirst | O(1) / O(1) / O(1) —— `tail->next` *就是* head |
| 循环 SLL，**仅 head**：addFirst | 若只能改指针则为 **O(n)**：最后一个节点的 `next` 必须指向新的 head，而找到最后一个节点需要遍历。（O(1) 技巧：把新节点插在 head *之后*，再交换两个节点的元素。） |
| 循环 SLL，仅 head：removeFirst | 只改指针时 O(n)，原因相同（O(1) 技巧：把 `head->next` 的元素复制到 head，再删除 `head->next`） |
| 没有 head 指针的循环 SLL 从头部删除（Quiz 2） | O(1)：`tail->next` |
| 什么改动能让 removeLast 变为 O(1)？（Quiz 2） | 给每个节点加一个 `prev` 指针（循环 DLL） |
| Quiz 2 的表述：列表 z → y → x → w，tail = w | 先 `x->next = head;`（或 `x->next = w->next;`），再 `tail = x;` |

**非循环、带 head 和 tail 的 SLL**（Lab 2 的 `removeLast`）：遍历方式相同，但前驱节点的 `next` 变为 `nullptr`，而且只有一个节点的情形要把 **head 和 tail 都**设为 `nullptr`。

**HW 1 中带哑头节点的 `InsertAtFront`：** 哑节点从不存放数据，因此没有空链表的特殊情况：

```cpp
void InsertAtFront(InventoryNode* headNode, InventoryNode* currNode) {
    currNode->nextNodeRef = headNode->nextNodeRef;   // new node -> old first
    headNode->nextNodeRef = currNode;                // dummy head -> new node
}
```

对 HW 输入的输出：`200 forks / 150 cups / 200 spoons / 100 plates`（与输入顺序相反）。两行的先后顺序很重要 —— 若颠倒，链表其余部分就会丢失。

---

## 7. 栈、队列与双端队列（样题 Q4）

### 7.1 底层用什么结构？（Quiz 3，第 5 讲）

| 问题 | 答案与理由 |
|---|---|
| 基于链表的栈 —— 时间与空间上最高效 | **不带 tail 的 SLL**：top = head，push/pop/peek 都是 O(1)；tail 或 `prev` 是浪费的内存 |
| 基于链表的队列 | **带 tail 的 SLL**：在 tail 入队，在 head 出队，两者都是 O(1)。反过来（在 head 入队，在 tail 出队）会使出队变为 O(n) |
| 严格的实时系统（飞控）：选 ArrayList 还是链表？ | **链表**：每次都是最坏 O(1)；ArrayList 偶发的 O(n) 扩容即使均摊是 O(1)，仍会造成延迟尖峰 |
| 基于普通 ArrayList 的队列 | 一端的代价为 O(n)（需要移动）；用**循环数组**修复 → 均摊 O(1) |
| 基于链表的双端队列 | **DLL**：两端删除都需要 `prev` |

### 7.2 样题 Q4 解答：用一个队列实现栈

让队列的**front = 栈顶**。`push` 时，先把新元素入队，然后把其后面的 n 个旧元素依次出队再入队，使它们轮转到新元素之后。

```cpp
// Assumption: I may add a counter (the Queue API has no size()).
template <typename T>
class Stack {
public:
    Stack() = default;
    bool isEmpty() { return q.isEmpty(); }
    void push(T item) {                       // O(n)
        q.enqueue(item);
        for (int i = 0; i < n; i++)           // move the n older items behind it
            q.enqueue(q.dequeue());
        n++;
    }
    T pop() {                                 // O(1)
        T x = q.dequeue();                    // dequeue throws if empty
        n--;
        return x;
    }
    T peek() { return q.peek(); }             // O(1)
private:
    Queue<T> q;
    int n = 0;
};
```

依次 push 1、2、3 → peek 得 3，pop 得 3，pop 得 2；push 4 → pop 得 4，pop 得 1（`peek 3 pops: 3241`）。

**(a) push：最坏 O(n)** —— 入队之后，n 个旧元素各被出队再入队一次，共 2n 次队列操作。**(b) pop：O(1)** —— 栈顶在队首，只需一次 `dequeue`。

**另一种有效设计**（pop 代价高）：`push` 只做入队（O(1)）；`pop` 把 n − 1 个元素轮转到队尾，然后出队最后一个（O(n)）。如果你的复杂度答案与**你自己**的代码一致，两种设计都能拿满分 —— 请说明你选的是哪一种。

> ⚠️ **易错点**：如果没有计数器，你无法判断一轮完整轮转何时结束（轮转过程中 `isEmpty` 永远不会为真）。请加上计数器并说明这是一条假设，而不要写出一个会无限轮转的循环。

### 7.3 变体

**用两个队列实现栈**（Lab 3 的 `QueueStack`）：push 把元素入队到 `secondary`，再把 `primary` 中的所有元素依次移到它后面，然后交换两个队列指针。push 为 O(n)，pop/peek 为 O(1)；对空栈 pop 会抛出 `std::underflow_error`。

```cpp
void push(const T& item) {
    secondary->enqueue(item);
    while (!primary->isEmpty()) secondary->enqueue(primary->dequeue());
    std::swap(primary, secondary);
}
```

**用两个栈实现队列**（HW 3，Quiz 3 再次出现）：enqueue 把元素压入 `stackIn`。dequeue/peek **仅当 `stackOut` 为空时**才转移：把 `stackIn` 中的所有元素弹出并压入 `stackOut`，这样会反转顺序，使最旧的元素位于栈顶。如果 `stackOut` 中仍有元素时就转移，会把较旧的元素埋在较新的元素之下，破坏 FIFO。

```cpp
void enqueue(const T& x) { stackIn.push(x); }            // O(1)
T dequeue() { transfer(); return stackOut.pop(); }       // O(n) worst, O(1) amortized
T peek()    { transfer(); return stackOut.peek(); }
void transfer() {
    if (!stackOut.isEmpty()) return;                      // only when stackOut is empty
    while (!stackIn.isEmpty()) stackOut.push(stackIn.pop());
    if (stackOut.isEmpty()) throw std::underflow_error("empty queue");
}
```

均摊 O(1)：每个元素在总体上最多被压入、弹出各两次（每个栈各一次），因此 n 次操作的代价为 O(n)。

HW 3 的 14 步操作追踪（栈从底到顶书写，取自编译运行结果）：

| # | 操作 | stackIn | stackOut | 返回值 |
|---|---|---|---|---|
| 1–3 | enqueue 10、20、30 | 10, 20, 30 | | |
| 4 | peek() | | 30, 20, 10 | 10 |
| 5 | dequeue() | | 30, 20 | 10 |
| 6 | peek() | | 30, 20 | 20 |
| 7 | dequeue() | | 30 | 20 |
| 8 | enqueue(40) | 40 | 30 | |
| 9 | enqueue(50) | 40, 50 | 30 | |
| 10 | peek() | 40, 50 | 30 | 30 |
| 11 | dequeue() | 40, 50 | | 30 |
| 12 | enqueue(60) | 40, 50, 60 | | |
| 13 | dequeue() | | 60, 50 | 40 |
| 14 | peek() | | 60, 50 | 50 |

Quiz 3 的较短版本：enqueue 7、9 → in 为 `7,9`；dequeue → in 为空，out 为 `9`，返回 7；enqueue 8 → in 为 `8`，out 为 `9`；dequeue → in 为 `8`，out 为空，返回 9；peek → in 为空，out 为 `8`，返回 8。

**用一个栈实现队列**（较难的变体）：利用递归 —— 调用栈充当第二个栈。出队时先弹出直到底部元素，然后在返回的过程中把其余元素再压回去。时间 O(n)，栈帧 O(n)。

```cpp
T dequeue() {
    T x = s.pop();                 // throws if empty
    if (s.isEmpty()) return x;     // x was the bottom = the front
    T front = dequeue();
    s.push(x);                     // restore in the original order
    return front;
}
```

### 7.4 循环数组与双端队列（Quiz 3，Lab 3）

约定 **`front` = 第一个有效元素，`rear` = 最后一个有效元素**（Quiz 3 的约定），在容量为 `size` 的循环数组上实现双端队列：

| 操作 | 下标更新 |
|---|---|
| 在前端 push | 先 `front = (front - 1 + size) % size;`，再存入 `front` |
| 在后端 push | 先 `rear = (rear + 1) % size;`，再存入 `rear` |
| 在前端 pop | 先读取 `front`，再 `front = (front + 1) % size;` |
| 在后端 pop | 先读取 `rear`，再 `rear = (rear - 1 + size) % size;` |

- **作为栈使用**：在**同一端**进行 push 和 pop（例如前端 push + 前端 pop）。
- **作为队列使用**：在一端 push，在另一端 pop（后端 push + 前端 pop）。

> ⚠️ **易错点**：当 `front` 为 0 时，`(front - 1) % size` 在 C++ 中为 −1 —— `%` 会保留符号。务必先加上 `size`。

**带扩容的 Lab 3 `CircularArray`**（约定 front + count；后端槽位为 `(front + count) % capacity`）：

```cpp
void enqueue(const T& x) {                       // amortized O(1)
    if (count == capacity) resize(2 * capacity);
    data[(front + count) % capacity] = x;
    count++;
}
T dequeue() {                                    // O(1)
    if (count == 0) throw std::underflow_error("dequeue on empty");
    T x = data[front];
    front = (front + 1) % capacity;
    count--;
    return x;
}
void resize(int newCap) {                        // copy in QUEUE order, not array order
    T* bigger = new T[newCap];
    for (int k = 0; k < count; k++) bigger[k] = data[(front + k) % capacity];
    delete[] data;
    data = bigger; capacity = newCap; front = 0;
}
```

> ⚠️ **易错点**：ArrayList 的 `expand`（把 `data[0..n-1]` 复制到相同下标）会破坏环绕的队列 —— 复制之后元素顺序就错了。应从 `front` 开始展开。满与空的区别：如果只有 front/rear，`front == rear` 可能两种情况都对；要么保留计数器，要么留出一个空槽。

**Lab 3 后缀表达式计算器**：操作数入栈；遇到运算符时先弹出 **v1 = 右操作数**，再弹出 v2 = 左操作数，然后压入 `v2 op v1`。除以零 → 抛出 `std::domain_error`，并把操作数压回；操作数不足两个 → 把唯一的那个压回；未知运算符 → 抛出 `std::invalid_argument`（[第 5 讲](lec-05.zh-CN.md#45-后缀表达式求值幻灯片-17)）。

---

## 8. 比较排序（样题 Q5）

### 8.1 汇总表（第 12 讲）

| 排序 | 原地 | 稳定 | 最好 | 平均 | 最坏 | 备注 |
|---|---|---|---|---|---|---|
| 选择排序 | ✓ | | O(n²) | O(n²) | O(n²) | n − 1 次交换 |
| 插入排序 | ✓ | ✓ | O(n) | O(n²) | O(n²) | 适用于小数组或部分有序的数组 |
| 归并排序 | | ✓ | O(n log n) | O(n log n) | O(n log n) | 有保证；需要 O(n) 额外空间 |
| 快速排序 | ✓ | | O(n log n) | O(n log n) | O(n²) | 概率上的保证；实践中最快 |
| 堆排序（期中不考） | ✓ | | O(n log n) | O(n log n) | O(n log n) | 有保证且原地 |

所有排序的代码：[选择排序与插入排序](lec-07.zh-CN.md#5-选择排序)、[归并](lec-08.zh-CN.md#2-合并两个已排序的半段)、[快速排序](lec-09.zh-CN.md#2-划分hoare-双指针方案)、[堆排序](#12-堆排序期中不考)。

### 8.2 识别中间状态

| 算法 | 排序中途的快照是什么样子 |
|---|---|
| 选择排序 | 前缀 = **k 个最小的键**，已排序，并位于其最终位置；其余部分保持原顺序，只是被换出的键落在了别处 |
| 插入排序 | 前缀 = **最初的前 k 个原始键**，已排序（不是 k 个最小的）；后缀保持不动 |
| 归并排序（自顶向下） | 在递归边界处已排序的段（前 2、3、5、9 …个元素），其后的部分保持不动 |
| 快速排序（枢轴 `a[lo]`，不洗牌） | 第一次划分之后：原来的第一个键位于下标 j，其左侧只剩比它小的键，右侧是比它大的键 |
| 堆排序（期中不考） | 后缀 = **最大的键**，已排序，位于最终位置；前缀满足堆序（其第一个元素是最大值） |

### 8.3 样题 Q5(a) 解答

各行按表格最后一列编号（第 0 行为输入，第 6 行为已排序结果）。我用课程代码对第 0 行的数组模拟了五种算法，并核对了每个快照：

| 行 | 数组 | 算法 | 理由 |
|---|---|---|---|
| 1 | 11 10 **12 15 16 18 20 21 28 32 35 40 41 42 43 44 46 47** | **5 堆排序** | 最大的 16 个键已排好序位于末尾；前缀 `11 10` 满足堆序（本学期不考堆排序，所以这道题的修改版很可能只列出另外四种排序） |
| 2 | **11 12 20 35 42 43 46 47** 44 32 16 10 … | **2 插入排序** | 最初的前 8 个*原始*键已排序，其余不动（10 不在最前面，所以不是选择排序） |
| 3 | **11 12 20 35 46** 43 42 47 44 … | **3 归并排序** | `sort(0,8)` → `sort(0,4)` 已完成：前 5 个已合并，其余不动 |
| 4 | 10 11 **12** 46 20 43 42 47 44 32 16 35 40 18 41 21 28 15 | **4 快速排序** | 第一次划分：原来的第一个键 12 位于下标 2，其左侧只有更小的键（10 11），右侧是更大的键（35 被换到了 10 原来的位置） |
| 5 | **10 11 12 15 16** 43 42 47 44 32 20 35 40 18 41 21 28 46 | **1 选择排序** | 5 个最小的键已就位；20、35、46 位于被换出的键原来的位置 |

**额外说明（不止一行符合时）：** 第 3 行也可以是插入排序进行 5 趟之后的结果，第 4 行也可以是选择排序进行 3 趟之后的结果。上面唯一匹配的答案来自第 2 行和第 5 行，只有一种算法能产生它们。

### 8.4 样题 Q5(b) 及其变体：比较次数

用课程代码测得（统计每一次键的比较），n = 1000 → n = 2000：

| 输入 | 选择 | 插入 | 归并 | 快速，枢轴 = 第一个 | 快速，三数取中 | 堆排序（不考） |
|---|---|---|---|---|---|---|
| **已排序**（样题） | **O(n²)** 499,500 → 1,999,000 | **O(n)** 999 → 1999 | **O(n log n)** 5,044 → 11,088 | **O(n²)** 501,498 → 2,002,998 | O(n log n) | O(n log n) |
| 逆序 | O(n²) | **O(n²)** 499,500 | O(n log n) | **O(n²)** | O(n log n) | O(n log n) |
| 所有键相等 | O(n²) | O(n) | O(n log n) | **O(n log n)** 8,898 → 19,786 | O(n log n) | O(n) 2,994 → 5,994 |

每种情况的一行解释：
- **选择排序**总是扫描整个未排序部分：n(n−1)/2，没有提前退出。
- **插入排序**在已排序输入上：每个元素比较一次，然后 `break` → n − 1。逆序：每个元素都要走到最前面 → n(n−1)/2。键全相等：`a[j] < a[j-1]` 立即为假 → n − 1。
- **归并排序**总是对半切分；每层至多 n 次比较，共 log₂ n 层（已排序输入仍需约 ½ n log n，因此是 n log n，而不是 n）。例外：加上 Lab 4 的跳过检查 `if (a[mid] <= a[mid + 1]) return;` 后，已排序输入上每次合并都被跳过 → O(n) 次比较。
- **快速排序，枢轴 = 第一个**，无论输入是已排序还是逆序：枢轴每次都是最小（或最大）的键 → 切分为 0 / n−1 → T(n) = T(n−1) + n = O(n²)。
- **快速排序处理全部相等的键**（HW 5 Q4）：两个扫描都在**与枢轴相等的键上停止**，因此 `i` 与 `j` 在中间相遇 → 均匀切分 → O(n log n)。如果扫描跳过相等的键，其中一个指针会一直跑到末尾 → O(n²)。
- **堆排序处理全部相等的键**：`sink` 从不移动任何元素，因此建堆与 sortdown 都是线性的（超出了幻灯片的内容 —— 幻灯片给出的是 O(n log n) 最坏情况）。

### 8.5 HW 5 题目（可能的变体）

**Q3：划分 `H O M E W O R K F I V E`**（枢轴 `v = H`，使用幻灯片代码，不洗牌）：

| 步骤 | i 停在 | j 停在 | 之后的数组 |
|---|---|---|---|
| 开始 | | | H O M E W O R K F I V E |
| 交换 1 | 1（O ≥ H） | 11（E ≤ H） | H **E** M E W O R K F I V **O** |
| 交换 2 | 2（M） | 8（F） | H E **F** E W O R K **M** I V O |
| 交错 | 4（W） | 3（E） | i ≥ j → 停止 |
| 最后 `swap(a[lo], a[j])` | | j = 3 | **E E F H** W O R K M I V O |

H 最终位于下标 3：其左侧都 ≤ H，右侧都 ≥ H。可在下方逐步演示（演示获得焦点时，← / → 键可用）：

```viz quick-sort
{"title": "HW 5 Q3：划分 H O M E W O R K F I V E", "items": "H, O, M, E, W, O, R, K, F, I, V, E", "mode": "partition"}
```

**Q5：从两个固定下标中选枢轴，能否修复 O(n²) 的最坏情况？** (a) 不可能：对于任何查看固定位置的确定性规则，对手都可以构造一个输入，使这两个位置在每个子数组中都持有最小的键，因此每次划分仍是 0 / n−1 → O(n²)。(b) 题目排除了洗牌和随机枢轴，所以修复必须改变枢轴*是什么*，而不是从哪里读取。要保证最坏 O(n log n)，枢轴必须总能均匀切分：用 median-of-medians 算法在每次调用中以 O(n) 找到**真正的中位数**作枢轴，得到 T(n) = 2T(n/2) + O(n) = O(n log n)。实际中的替代方案是：递归过深时停止快速排序、改用堆排序收尾（最坏 O(n log n)，见 [§12](#12-堆排序期中不考)）——`std::sort` 就是这样做的。（两者都超出幻灯片范围；幻灯片里的工具——洗牌和 Lab 4 的 `RANDOM` 枢轴——只能让最坏情况*不太可能*出现。）三数取中（[第 9 讲](lec-09.zh-CN.md#71-枢轴策略的代码实现lab-4)）同样是固定位置规则，所以和同学的想法有同样的问题。

**Quiz 4 Q1（快速排序分析）。** 最坏情况：当输入已经有序（升序**或**降序）且枢轴取自固定位置时，运行时间为 **O(n²)**。有两种方法能对任意输入给出*概率性*的保证：(1) 排序前**随机洗牌**数组；(2) **随机**选择枢轴（或取随机抽取的 3 个样本的中位数）。两者都保留了 O(n²) 情况出现的可能，但都使它对每个输入都极不可能发生。

**Q1–2：去掉 `i > mid` / `j > hi` 检查的归并**：把右半部分**反向**复制到 `aux`，然后从两端向中间合并；每一半的最大键起到哨兵的作用。更快，但不稳定。完整代码见 [第 8 讲 §6.2](lec-08.zh-CN.md#62-去掉耗尽检查的合并hw-5)。

**Lab 4 需要掌握的补充内容**：小子数组的插入排序截止（内层循环必须停在 `j > lo`）、“已经有序”的跳过检查 `if (data[mid] <= data[mid + 1]) return;`、三数取中把中位数移到 `a[lo]`，使不变的划分代码可以直接使用它（[第 8 讲 §6.1](lec-08.zh-CN.md#61-改进-1-和-2-的代码实现lab-4)、[第 9 讲 §7.1](lec-09.zh-CN.md#71-枢轴策略的代码实现lab-4)）。

### 8.6 稳定性与内存，简述

- **稳定**：插入排序（只交换相邻且严格更小的元素）与归并（相等时从左侧取）。**不稳定**：选择排序（长距离交换）、快速排序（长距离交换）、堆排序（sortdown 把根交换到末尾）。
- **额外内存**：归并为 O(n)（`aux`）；快速排序的递归平均为 O(log n)（最坏 O(n)）；选择、插入、堆排序为 O(1)。
- **下界**：每一种基于比较的排序在最坏情况下都需要 Ω(n log n) 次比较。

---

## 9. 树、二叉树与遍历

完整讲解：[第 10 讲](lec-10.zh-CN.md)。考试相关要点：

| 术语 | 定义 | 陷阱 |
|---|---|---|
| 节点的深度（= 层） | 从根到它的边数；根的深度为 0 | 按**边**计数，而不是按节点计数 |
| 节点的高度 | 从它向下到叶子的最长路径上的边数；叶子为 0 | 递归公式中空树为 −1 |
| 树的高度 | 根的高度 = 最大深度 | 单个节点的高度为 0 |
| 叶子 / 内部节点 | 0 个子节点 / 至少 1 个子节点 | 只有一个子节点的节点是内部节点 |
| 度 | 子节点的个数（二叉树：≤ 2） | |
| 满（真）二叉树 | 每个节点都有 **0 或 2** 个子节点 | |
| 完全二叉树 | 除最后一层外每层都是满的，最后一层从左到右填满 | 满与完全相互独立 |

**节点数。** 第 k 层最多有 2ᵏ 个节点；高度为 h 的树有 h + 1 ≤ n ≤ 2^(h+1) − 1 个节点，因此其高度介于 ⌈log₂(n+1)⌉ − 1（完全树）与 n − 1（“棍子”）之间。每个沿着一条根到叶子路径走的操作都是 O(高度)：树较矮时为 O(log n)，树是棍子时为 O(n)。

**遍历**（时间均为 O(n)；递归版本使用 O(高度) 的栈空间）：

| 顺序 | 规则 | 典型用途 |
|---|---|---|
| 前序 | 根、左、右 | 复制一棵树 |
| 中序 | 左、根、右 | **BST 的有序顺序** |
| 后序 | 左、右、根 | 删除 / 释放一棵树，计算高度 |
| 层序 | 逐层、从左到右，用**队列** | 广度优先 |

```cpp
void preorder(Node* t) {
    if (t == nullptr) return;
    visit(t->item);              // root first
    preorder(t->left);
    preorder(t->right);
}
// inorder:   inorder(t->left);  visit(t->item);  inorder(t->right);
// postorder: postorder(t->left); postorder(t->right); visit(t->item);

void levelorder() const {
    std::queue<Node*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        Node* t = q.front(); q.pop();
        visit(t->item);
        if (t->left)  q.push(t->left);
        if (t->right) q.push(t->right);
    }
}

int height(Node* t) {            // post-order: children first
    if (t == nullptr) return -1;
    return 1 + std::max(height(t->left), height(t->right));
}
```

> 💡 **关键洞见**：通过根来检验遍历结果：前序中根最先出现，后序中根最后出现，中序中根把左子树的键与右子树的键分开。

**第 10 讲练习解答**（细节见 [第 10 讲 §15](lec-10.zh-CN.md#15-课堂活动附解答)）：
- 活动 1（根为 8；5 → 9、7；7 → 1、12；12 → 左侧为 2；4 → 右侧为 11；11 → 左侧为 3）：前序 `8 5 9 7 1 12 2 4 11 3`，中序 `9 5 1 7 2 12 8 4 3 11`，后序 `9 1 2 12 7 5 3 11 4 8`，层序 `8 5 4 9 7 11 1 12 3 2`。
- 满二叉树或完全二叉树：只有右子节点的根既不是满树也不是完全树；最后一层从左到右填充但有一个节点只有一个子节点的树是完全树，而不是满树。

**变体：第 12 讲活动中 BST 的四种顺序**（8；3 → 1、6；6 → 4、7；10 → 右侧为 14；14 → 左侧为 13），来自编译运行结果：

| 顺序 | 序列 |
|---|---|
| 前序 | 8 3 1 6 4 7 10 14 13 |
| 中序 | 1 3 4 6 7 8 10 13 14（有序——它是一棵 BST） |
| 后序 | 1 4 7 6 3 13 14 10 8 |
| 层序 | 8 3 10 1 6 14 4 7 13 |

高度为 3，共 9 个节点。可在下方逐步演示中序遍历（演示获得焦点时，← / → 键可用）：

```viz tree-traversal
{"title": "变体：第 12 讲活动 BST 的中序遍历", "tree": "8, 3, 10, 1, 6, -, 14, -, -, 4, 7, -, -, 13", "order": "in", "interactive": true}
```

> ⚠️ **易错点**：在中序遍历中，没有左子节点的节点会先于其右子树被访问（上面的 10 排在 13 和 14 之前）。在层序遍历中，左边的深层节点仍然排在右边所有更浅节点之后。

### 9.1 由前序与中序重建树（Quiz 4 Q3）

**两种次序各自告诉你什么：** 前序（根、左、右）的**第一个**键就是根。中序（左、根、右）中，根把序列**划分**为左子树的键与右子树的键。对两侧分别递归，依次从前序中取出下一个根。

**Quiz 4：** 前序 `50 36 17 2 0 3 28 30 1`，中序 `2 17 0 36 3 50 30 28 1`。

| 步骤 | 根（取自前序） | 中序划分：左 \| 右 |
|---|---|---|
| 整棵树 | 50 | 2 17 0 36 3 \| 30 28 1 |
| 50 的左侧 | 36 | 2 17 0 \| 3 |
| 36 的左侧 | 17 | 2 \| 0 |
| 50 的右侧 | 28 | 30 \| 1 |

因此 50 → 36、28；36 → 17、3；17 → 2、0；28 → 30、1。核对（编译运行结果）：其后序为 `2 0 17 3 36 30 1 28 50`。

```viz binary-tree
{"title": "Quiz 4 Q3：重建后的树", "tree": "50, 36, 28, 17, 3, 30, 1, 2, 0", "views": "plain; subtree:36; subtree:28"}
```

变体：
- **后序 + 中序**的做法相同，但根是后序的**最后一个**键，并且从后序末尾反向读取时要先构建**右**子树。
- **前序 + 后序**通常不够：只有一个子节点的节点，无论该子节点在左边还是右边，其前序与后序都相同。中序才能区分左与右。
- 只给了一种次序？结果不唯一——除非树是 **BST**：此时中序就是有序的键，仅凭前序即可确定（按前序顺序插入这些键）。

---

## 10. 堆与优先队列

完整讲解：[第 10 讲](lec-10.zh-CN.md#9-堆有序的二叉树)和[第 11 讲](lec-11.zh-CN.md)。

二叉堆是一棵**完全**二叉树，并且是**堆有序**的（在最大堆中，每个父节点都 ≥ 其子节点），存放在从下标 1 开始的数组中：

| 1 起始（幻灯片） | 0 起始（如果你使用它） |
|---|---|
| k 的父节点 = k/2 | i 的父节点 = (i − 1)/2 |
| k 的子节点 = 2k、2k + 1 | i 的子节点 = 2i + 1、2i + 2 |
| 最后一个内部节点 = n/2 | 最后一个内部节点 = n/2 − 1 |

幻灯片代码（固定大小数组 `pq[0..capacity]`，`pq[0]` 不使用；[第 11 讲 §9](lec-11.zh-CN.md#9-完整实现) 的 `std::vector` 版本用 `push_back` 代替 `pq[++n] = x`）：

```cpp
void swim(size_t k) {                 // move up while larger than the parent
    while (k > 1 && less(k/2, k)) {
        exch(k, k/2);
        k = k/2;
    }
}
void sink(size_t k) {                 // move down toward the LARGER child
    while (2*k <= n) {
        size_t j = 2*k;
        if (j < n && less(j, j+1)) j++;
        if (!less(k, j)) break;
        exch(k, j);
        k = j;
    }
}
void insert(const Key& x) { pq[++n] = x; swim(n); }
Key delMax() {
    Key max = pq[1];
    exch(1, n--);                     // last key to the root
    sink(1);
    return max;
}
```

| 操作 | 最坏情况 | 比较次数 |
|---|---|---|
| insert（追加 + swim） | O(log n) | ≤ log n + 1 |
| delMax（exch + sink） | O(log n) | ≤ 2 log n（每层两次） |
| 找最大值 | O(1) | 0 |
| 朴素建堆（n 次插入） | O(n log n) | |
| 自底向上建堆 | **O(n)** | |

| 优先队列基于 | 插入 | 删除最大值 |
|---|---|---|
| 无序数组 | O(1) | O(n) |
| 有序数组 | O(n) | O(1) |
| 二叉堆 | O(log n) | O(log n) |

**最小堆**：代码相同，只需翻转比较——最小键位于根，键在小于其父节点时上浮，下沉时朝较小的子节点进行。

### 10.1 第 11 讲练习解答

起始最大堆：`– 100 19 36 17 3 25 1 2 7`（详见 [第 11 讲 §10](lec-11.zh-CN.md#10-课堂活动附解答)）；所有结果都已通过编译运行核对。

| 练习 | 答案 |
|---|---|
| 插入 47 | 47 放到下标 10（下标 5 的左子节点）；越过 3 和 19 上浮，停在 100 之下 → `– 100 47 36 17 19 25 1 2 7 3` |
| 在 `– 19 7 36 17 3 25 1 2` 中对 7 执行 sink | 7 < 较大的子节点 17 → 交换；7 > 其子节点 2 → 停止 → `– 19 17 36 7 3 25 1 2` |
| delMax | 返回 100；7 移到根并越过 36 和 25 下沉 → `– 36 19 25 17 3 7 1 2` |
| 9 次 delMax | 返回 `100 36 25 19 17 7 3 2 1`；数组最终按升序排列 |
| 最小堆：插入 P、Q、E，delMin，……（12 步） | 最终堆 `L P M Q P X`；步骤表见第 11 讲 §10.4 |

### 10.2 自底向上建堆（第 12 讲活动，第 1–3 部分）

```cpp
for (int k = n/2; k >= 1; k--)        // skip the leaves; sink every internal node
    sink(a, k, n);
```

**第 1 部分：[2, 9, 7, 6, 5, 8]。** n = 6，因此循环从 k = 6/2 = 3 开始（节点 4–6 是叶子）。

| 调用 | 发生了什么 | 数组 |
|---|---|---|
| 开始 | | 2 9 7 6 5 8 |
| `sink(3, 6)` | 7 < 其子节点 8 → 交换 | 2 9 **8** 6 5 **7** |
| `sink(2, 6)` | 9 ≥ 子节点 6、5 → 不移动 | 2 9 8 6 5 7 |
| `sink(1, 6)` | 2 < 较大的子节点 9 → 交换；2 < 较大的子节点 6 → 交换 | **9 6** 8 **2** 5 7 |

可在下方逐步演示（演示获得焦点时，← / → 键可用）：

```viz binary-heap
{"title": "第 12 讲活动：对 2 9 7 6 5 8 建堆", "heap": "2, 9, 7, 6, 5, 8", "ops": "sink(3); sink(2); sink(1)", "interactive": true}
```

**第 2 部分——朴素建堆**（逐个插入，每个都上浮）：n 次插入 × O(log n) = **O(n log n)**。
**第 3 部分——自底向上建堆：O(n)。** 一半的节点是叶子（下沉代价为 0），四分之一的节点最多下沉 1 层，八分之一的节点最多下沉 2 层，……：总计 ≤ n（0/2 + 1/4 + 2/8 + 3/16 + …）≤ n · 1。大多数节点都靠近底部，那里下沉很便宜。（幻灯片中的移位方法：S = Σ k/2^(k+1)；S − S/2 是一个等比级数，因此 S = 1。）

### 10.3 变体

| 问题 | 答案 |
|---|---|
| `– 50 30 40 35 10 20` 是一个最大堆吗？ | 否：35（下标 4）是 30（下标 2）的子节点。检查每个 k ≥ 2：`pq[k/2] >= pq[k]` |
| 最大堆的**最小值**在哪里？ | 在某个叶子中，下标为 n/2 + 1 … n；找到它需要 O(n) |
| 有 n 个键的堆的高度 | ⌊log₂ n⌋——它是完全的，因此永远不会变成棍子 |
| 为什么自底向上建堆从 n/2 开始？ | ⌊n/2⌋ 是最后一个有子节点的节点；下沉叶子不做任何事 |
| 为什么 sink 选择**较大**的子节点？ | 较大的子节点将成为另一个子节点的父节点，因此堆序得以保持 |
| 降序数组是最大堆吗？ | 是——每个父节点都排在其子节点之前（且 ≥ 它们） |

> ⚠️ **易错点**：下标运算。把 1 起始的公式（子节点 2k、2k + 1）用在 0 起始的 C++ 数组上，是经典的堆错误——请说明你采用的约定。

### 10.4 Quiz 4，Q2 与 Q4

**Q2。** 对于从 1 开始编号的堆：父节点 = i/2，左子节点 = 2i，右子节点 = 2i + 1。优化的（自底向上）建堆从下标 **n/2** 开始下沉，最坏代价为 **O(n)**。

**Q4。** 从 `50 36 17 2 0 3 28 30 1` 建立最大堆（n = 9，从 k = 9/2 = 4 开始），然后调用 delete max。以下来自编译运行结果：

| 步骤 | 数组（下标 1 … 9） |
|---|---|
| 开始 | 50 36 17 2 0 3 28 30 1 |
| `sink(4)`：2 < 较大子节点 30 → 交换 | 50 36 17 **30** 0 3 28 **2** 1 |
| `sink(3)`：17 < 较大子节点 28 → 交换 | 50 36 **28** 30 0 3 **17** 2 1 |
| `sink(2)`、`sink(1)`：已经有序 | 50 36 28 30 0 3 17 2 1 |
| delMax，初始交换 `exch(1, 9)` | **1** 36 28 30 0 3 17 2 \| 50 |
| `sink(1)`：1 ↓ 36，↓ 30，↓ 2 | 36 30 28 2 0 3 17 1 |

delMax 返回 50。评分标准接受“初始交换”图示中下标 9 处保留或不保留 50 的两种画法。

```viz binary-heap
{"title": "Quiz 4 Q4：建立最大堆，然后 delMax", "heap": "50, 36, 17, 2, 0, 3, 28, 30, 1", "ops": "sink(4); sink(3); sink(2); sink(1); delMax()"}
```

（Q2 的最后一问，即用最小堆做堆排序，见折叠的 [§12](#12-堆排序期中不考)。）

---

## 11. 二叉搜索树

**对称序**：每个节点的键都**大于其左子树中的所有键**，并且**小于其右子树中的所有键**。我们假设**没有重复键**。教材中的 BST 是一个字典：每个节点保存一个键值对、两个子树指针，以及可选的 **size**（其子树中的节点数，用于求第 k 小）。BST 本身只是 `Node* root`。

幻灯片代码（幻灯片第 18 页，`put`/`get` 幻灯片）：

```cpp
template <typename Key, typename Value>   // slide has a typo: "template <template Key, ...>"
class BST {
private:
    class Node {
        Key key;              // sorted by key
        Value val;            // associated value
        Node* left, right;    // roots of left and right subtrees
        int size;             // #nodes in subtree rooted at this
        Node(const Key& k, const Value& v, int s)
            : key(k), val(v), left(nullptr), right(nullptr), size(s) {}
    };
    Node* root;               // root of BST
};
```

> ⚠️ **易错点**：幻灯片声明了 `Node* left, right;`——在 C++ 中这使得 `left` 是指针，而 `right` 是普通的 `Node`（在 `Node` 内部甚至无法编译）。应写成 `Node* left; Node* right;`（或 `Node *left, *right;`）。`BST` 要访问 `Node` 的成员，`Node` 还需要 `public:` 或 `friend`。

```cpp
Value get(Node* x, const Key& key) const {
    if (x == nullptr)
        return Value();                 // miss
    if (key < x->key)
        return get(x->left, key);
    else if (key > x->key)
        return get(x->right, key);
    else
        return x->val;                  // hit
}
Node* put(Node* x, const Key& key, const Value& val) {
    if (x == nullptr)
        return new Node(key, val, 1);   // reached a null link: new leaf
    if (key < x->key)
        x->left = put(x->left, key, val);
    else if (key > x->key)
        x->right = put(x->right, key, val);
    else
        x->val = val;                   // key exists: update the value
    x->size = 1 + size(x->left) + size(x->right);
    return x;
}
```

- **查找/插入的比较次数 = 节点深度 + 1。**
- `put` 返回子树的（可能是新的）根，调用者重新赋值链接（`x->left = put(...)`）——这就是 `nullptr` 链接如何变成新节点，以及 size 如何在回溯时被修正。

### 11.1 删除（Hibbard）

| 情形 | 做法 |
|---|---|
| 1. 叶子 | 删除它（父节点的链接变为 `nullptr`） |
| 2. 一个子节点 | 用其子节点替换该节点 |
| 3. 两个子节点 | 用其**后继**替换它——即下一个更大的键 = **右子树中最左的节点**；后继的右子节点（它没有左子节点）上移到后继原来的位置 |

Hibbard 删除总是使用后继，因此多次删除之后树会向左倾斜（偏斜）。**对称 Hibbard 删除**交替（或随机选择）后继与前驱；在实验中它能使高度保持在接近 O(log n)，但没有形式化证明。

我对 Hibbard 删除的实现（幻灯片以图片而非代码展示这些情形）；已在活动 4 与 5 上编译并核对：

```cpp
Node* min(Node* x) const { return x->left == nullptr ? x : min(x->left); }
Node* deleteMin(Node* x) {                // unlink the min, don't free it
    if (x->left == nullptr) return x->right;
    x->left = deleteMin(x->left);
    x->size = 1 + size(x->left) + size(x->right);
    return x;
}
Node* remove(Node* x, const Key& key) {
    if (x == nullptr) return nullptr;     // key not found
    if (key < x->key) x->left = remove(x->left, key);
    else if (key > x->key) x->right = remove(x->right, key);
    else {
        if (x->right == nullptr) { Node* l = x->left; delete x; return l; }
        if (x->left == nullptr) { Node* r = x->right; delete x; return r; }
        Node* t = x;                      // two children:
        x = min(t->right);                // successor
        x->right = deleteMin(t->right);   // its right child moves up
        x->left = t->left;
        delete t;
    }
    x->size = 1 + size(x->left) + size(x->right);
    return x;
}
```

### 11.2 形态与代价

| | 查找 | 插入 | 删除 |
|---|---|---|---|
| BST，最坏情况 | O(n) | O(n) | O(n) |
| BST，平均（随机插入顺序） | O(log n) | O(log n) | O(√n) —— Hibbard 删除会让树倾斜（第 14 讲汇总表） |
| 目标（平衡树，期中之后） | O(log n) | O(log n) | O(log n) |

- 相同的键，根据插入顺序的不同会得到不同的树。随机顺序 → 期望高度 O(log n)。**有序（或逆序）→ 高度为 n − 1 的棍子**：按顺序插入 1 … 7 得到高度 6；按 4 2 6 1 3 5 7 插入得到高度 2（编译运行结果）。
- 中序遍历按序输出键（O(n)）；最小值是最左节点，最大值是最右节点。

### 11.3 第 12 讲活动 2 至 5 解答

以下全部基于这棵 BST（仅键），所有结果均来自编译运行：

```viz binary-tree
{"title": "第 12 讲活动 2–4：BST", "tree": "8, 3, 10, 1, 6, -, 14, -, -, 4, 7, -, -, 13", "views": "plain; path:8-3-6-4; path:8-10"}
```

**活动 2——查找 4 与 9。** 4：8 → 左，3 → 右，6 → 左，4 **命中**（4 次比较 = 深度 3 + 1）。9：8 → 右，10 → 左为 `nullptr` → **未命中**，共 2 次比较后结束。

**活动 3——添加 (4, 3) 与 (9, 2)。** 4 已存在 → 其值**更新**为 3，不新建节点。9：8 → 右，10 → 左为空 → 新叶子 **9 作为 10 的左子节点**。大小从 9 变为 10。

**活动 4——从原树中依次删除每个键：**

| 删除 | 情形 | 结果 |
|---|---|---|
| 1 | 叶子 | 3 的左子节点变为 `nullptr` |
| 14 | 一个子节点 | 13 取代 14 的位置，成为 10 的右子节点 |
| 6 | 两个子节点 | 后继 7（{7} 中最左）取代 6；7 的左子节点为 4 |
| 3 | 两个子节点 | 后继 4（6 的子树中最左）取代 3：4 → 1、6；6 只保留 7 |
| 8 | 两个子节点 | 后继 10（10 没有左子节点）成为根：10 → 3、14 |

```viz binary-tree
{"title": "第 12 讲活动 4：每次删除之后的树", "tree": "删除 1 = 8, 3, 10, -, 6, -, 14, -, -, 4, 7, -, -, 13 | 删除 14 = 8, 3, 10, 1, 6, -, 13, -, -, 4, 7 | 删除 6 = 8, 3, 10, 1, 7, -, 14, -, -, 4, -, -, -, 13 | 删除 3 = 8, 4, 10, 1, 6, -, 14, -, -, -, 7, -, -, 13 | 删除 8 = 10, 3, 14, 1, 6, 13, -, -, -, 4, 7"}
```

**活动 5——删除 21（Hibbard）。** 21 有两个子节点。后继 = 右子树中最左：79 → 73 → **70**（没有左子节点）。70 的右子节点 71 上移到 70 的位置（73 的左子节点处），70 取代根上的 21。

```viz binary-tree
{"title": "第 12 讲活动 5：删除 21", "tree": "之前 = 21, 10, 79, -, -, 73, 95, -, -, -, -, 70, 74, -, -, -, -, -, -, -, -, -, -, -, 71 | 之后 = 70, 10, 79, -, -, 73, 95, -, -, -, -, 71, 74"}
```

### 11.4 变体

| 问题 | 答案 |
|---|---|
| 改用**前驱**进行删除 | 左子树中最右的节点；它的左子节点上移。删除上面的 8 → 7 成为根 |
| 哪种插入顺序会形成棍子？ | 有序或逆序的键 —— 更一般地，每个键插入时都是**尚未插入**的键中最小或最大的那个（例如 1, 7, 4 形成之字形棍子；4, 1, 7 则不会） |
| 按有序顺序插入 n 个键后的高度 | n − 1；之后查找/插入/删除的代价均为 O(n) |
| 查找一个键的比较次数 | 它的深度 + 1（未命中：到达的空链接的深度） |
| 中序序列是否足以检验一棵 BST？ | 是——二叉树是 BST，当且仅当其中序遍历严格递增 |
| 只在每个节点检查 `left->key < key < right->key` | **不够**：左子树中的每个键都必须更小，而不仅仅是子节点 |

> ⚠️ **易错点**：在情形 3 中，后继**绝不**只是“右子节点”，除非该子节点没有左子节点（活动 4，删除 8）。先向右走一步，然后尽可能向左走。

---

## 12. 堆排序（期中不考）

Prof. Yeh 已确认堆排序**不会**出现在期中考试中。这部分内容保留在此，供期末使用——需要时请展开。

<details>
<summary><b>堆排序：sortdown、第 12 讲活动 1 与分析（点击展开）</b></summary>

在堆的从 1 开始的数组上分两个阶段：自底向上建堆（[§10.2](#102-自底向上建堆第-12-讲活动第-13-部分)），然后 **sortdown**——把最大值移到末尾，缩小堆，修复根：

```cpp
while (n > 1) {
    exch(a, 1, n--);
    sink(a, 1, n);
}
```

**第 12 讲活动 1：从 9 6 8 2 5 7 开始 sortdown。** 来自编译运行结果（`|` 之后的部分已经排好序）：

| 步骤 | 数组 |
|---|---|
| 开始（堆） | 9 6 8 2 5 7 |
| exch 9 ↔ 7，sink 7 | 8 6 7 2 5 \| 9 |
| exch 8 ↔ 5，sink 5 | 7 6 5 2 \| 8 9 |
| exch 7 ↔ 2，sink 2 | 6 2 5 \| 7 8 9 |
| exch 6 ↔ 5，sink 5 | 5 2 \| 6 7 8 9 |
| exch 5 ↔ 2 | 2 \| 5 6 7 8 9 |

**sortdown 的最坏情况：O(n log n)**——n − 1 次交换，每次之后都是至多 log₂ n 层的下沉（每层 2 次比较）。

**堆排序分析（第 12 讲幻灯片）。**

- 建堆：O(n) 次比较与交换。sortdown 与总计：**O(n log n)** 次比较与交换，**最坏情况**，原地（无额外数组）。
- 与归并排序相比：保证相同，但归并需要 O(n) 额外空间。与快速排序相比：同样是原地，但快速排序的最坏情况是 O(n²)。
- 它仍不是默认选择的原因：内层循环较长（每次比较的常数比快速排序高），**缓存局部性差**（k 跳到 2k：内存位置相距很远），并且**不稳定**。
- sortdown 过程中的关键不变式：数组由一个堆有序的前缀，加上一个处于最终有序位置的后缀组成。
- 在全部相等的键上，`sink` 从不移动，因此堆排序只进行 O(n) 次比较（超出幻灯片的内容）。
- Quiz 4：用**最小堆**做堆排序时，每次把最小值移到末尾，因此数组最终是**从大到小**（降序）排列的。

</details>

---

## 13. 模板、指针、智能指针、二维数组

早期讲次的主题也在考试范围内，尽管样题中没有相关题目。以下是适合作为简短问题的要点：

**模板**（[第 0 讲](lec-00.zh-CN.md)）：
- 模板是一份蓝图；`Box<int>` 与 `Box<double>` 是在**编译期**创建的两种独立且无关的类型。
- 使用模板的地方必须能看到完整定义 → 使用 `.hpp`（或 `.hpp` + `.tpp`），而不是单独的 `.cpp`。
- 对 `T` 的约束是隐含的：列出函数体对 `T` 执行的每一种操作（`<`、复制、赋值、`<<`）。
- 推导不做类型转换：`myMin(3, 4.5)` 会失败；应写 `myMin<double>(3, 4.5)`。

HW 1 中的 `Pair::CompareWith`（已编译；输出 `[4, 6] > [3, 5]`、`[4.3, 2.1] = [4.3, 2.1]`、`[one, two] < [three, four]`）—— 它只需要 `TheType` 支持 `<`：

```cpp
template<typename TheType>
char Pair<TheType>::CompareWith(Pair<TheType>* otherPair) {
   if (firstVal < otherPair->firstVal) return '<';
   if (otherPair->firstVal < firstVal) return '>';
   if (secondVal < otherPair->secondVal) return '<';
   if (otherPair->secondVal < secondVal) return '>';
   return '=';
}
```

**随机性**（[第 1 讲](lec-01.zh-CN.md#1-随机性与随机数生成)）：只为引擎设置一次种子（`std::default_random_engine engine{device()};`，或为可复现的测试使用固定种子），并且始终通过分布来取随机数（`std::uniform_int_distribution<int> d{1, 6}; d(engine)`）。

**引用与指针**（[第 1 讲](lec-01.zh-CN.md#2-c-引用)）：
- 引用是永久的别名：通过它赋值会改变原对象，它不能被重新绑定，也绝不能返回指向局部变量的引用。
- `*a = *b` 复制的是**值**；`a = b` 复制的是**地址**（可能导致旧对象泄漏，并引发重复 delete）。
- 只 `new` 不 `delete` 会泄漏；在 `delete` 之后继续使用指针是悬空指针。

**智能指针**（[第 1 讲](lec-01.zh-CN.md#4-智能指针与所有权)、[第 2 讲](lec-02.zh-CN.md#1-智能指针所有权收尾)）：

| 类型 | 所有权 | 考试要点 |
|---|---|---|
| `unique_ptr` | 恰好一个所有者 | 复制会导致编译错误；`std::move` 转移所有权，并使源指针变为 `nullptr` |
| `shared_ptr` | 引用计数 | 对象随最后一个所有者一起销毁；父 ↔ 子的循环会**泄漏** |
| `weak_ptr` | 不拥有 | 打破循环（子 → 父）；使用前先 `lock()` |

**多维数组**（[第 2 讲](lec-02.zh-CN.md#3-多维数组)）：行优先。对于 `T a[R][C]`，`a[i][j]` 是从起点开始的第 `i·C + j` 个元素，地址为 `base + (i·C + j)·sizeof(T)`。对于 `a[D][R][C]`：`(i·R·C + j·C + k)`。HW 2 的内存题：`int[R][C]` 占 4·R·C 字节（`int` 为 4 字节）；在 64 位机器上指针为 8 字节；1 GB = 2³⁰ 字节 = 2³³ 位。

---

## 14. 设计题

预计会有一道题要求你**设计**一个在给定成本下的结构，通常是把你已经熟悉的两种结构组合起来 —— 就像 Lab 2 的 `BalancedList` 把数组与链表组合起来一样。一个可行的方法：

1. 写出目标表（操作 → 所需的界）。
2. 对每个操作，判断哪种已知结构能给出该界以及原因（下标运算 → 数组；在已知位置做 O(1) 拼接 → 链式节点；两端都要 → 循环数组 / DLL）。
3. 把它们组合起来，并检查表中的每一行，包括任何扩容的最坏情况。
4. 说明使其成立的不变式和假设。

**实例：Lab 2 的 `BalancedList`** —— 目标：在前端 `add(item)`，以及从前端 `get(index)` 和 `remove()` 都要求**最坏** O(log n)；`add(index)` / `remove(index)` 可以是 O(n)。一种满足要求的设计（这是我自己的设计，而非官方解答）：

- 一条单链的节点链，其容量按 **倍增** 排列：1、2、4、8、……因此 n 个元素只需约 log₂ n 个节点。
- 每个节点用一个小的**循环数组**存放元素，因此在该节点的任一端添加或删除都是 O(1)。⚠️ 这与实验的起始代码不同：实验中每个节点存的是普通 ArrayList，且类定义不能修改；用 ArrayList 时，在节点前端添加要移动整个节点，下面的级联就会变成 O(n)。考试时要写明你假设的节点表示。
- 假设分配节点时不构造其槽位（或保留一个备用节点），这样链增长一个节点不会花 O(n)。
- `get(i)`：按节点的大小整体跳过节点（最多 log n 个节点），然后在节点内部按下标取值 → O(log n)。
- 在前端 `add(item)`：插入到节点 0 的前端；如果溢出，就把节点 0 的最后一个元素移到节点 1 的前端，依此类推沿链向下 → 最多 log n 次 O(1) 移动 → O(log n)。
- 从前端 `remove()`：从节点 0 删除，然后把每个后续节点的第一个元素拉回上一个节点 → O(log n)。
- 不变式：除最后一个节点外，每个节点都是满的，因此位置可以通过容量的算术直接算出。

为什么普通的展开链表（每个节点 10 个元素）不够：它有 n/10 个节点，因此 `get` 仍是 O(n)。修复办法是让**节点数量**为对数级。

---

## 15. 必须熟记的实验代码

### 15.1 每个实验的内容

| 实验 | 需要能默写的内容 | 位置 |
|---|---|---|
| 1 | 一个带构造函数、getter、`toString` 的小类；Google Test 的 `EXPECT_EQ` | [第 0 讲 §2](lec-00.zh-CN.md#2-用-google-test-编写-c-单元测试) |
| 2 | ArrayList 的 `add(i)`、`remove(i)`、`expand`、`shrink`；带 tail 的 SLL 的 `get`、`add(i)`、`remove(i)`、`addLast`、`removeLast`；BalancedList 的思路 | [§5](#5-arraylist-与均摊分析)、[§6](#6-链表样题-q3)、[§14](#14-设计题) |
| 3 | `CircularArray` 的 enqueue/dequeue/resize；用两个队列实现的 `QueueStack`；后缀计算器 | [§7](#7-栈队列与双端队列样题-q4) |
| 4 | 选择排序、插入排序（交换版本）、带截止与辅助数组的优化归并、使用 Hoare 划分的快速排序、三数取中、随机枢轴 | [§8](#8-比较排序样题-q5) |

### 15.2 代码库（已编译）

本页所有内容集中在一处：`CircularLinkedList`（仅 tail）、两种设计的单队列栈、双队列栈、双栈队列、单栈队列、带扩容的 `CircularArray`、带比较计数器的五种排序，以及 mystery 方法。

```cpp
template <typename T>
class CircularLinkedList {
    struct Node { T item; Node* next; };
    Node* tail = nullptr;                      // tail->next is the first node
    int count = 0;
public:
    ~CircularLinkedList() { while (count > 0) removeFirst(); }
    void addLast(const T& item);               // §6.3
    void addFirst(const T& item);              // §6.3
    T removeFirst();                           // §6.3
    T removeLast();                            // §6.2
};

template <typename T>
class StackOneQueuePop {                       // §7.2, pop-costly design
    Queue<T> q;                                // top = rear of q
    int n = 0;
public:
    bool isEmpty() { return q.isEmpty(); }
    void push(T item) { q.enqueue(item); n++; }            // O(1)
    T pop() {                                               // O(n)
        if (n == 0) throw std::underflow_error("pop on empty stack");
        for (int i = 0; i < n - 1; i++) q.enqueue(q.dequeue());
        n--;
        return q.dequeue();
    }
};

// Heap sort (not on the midterm) on a 0-based C++ array: heap index k (1..n) lives in a[k-1]
template <typename T>
void sink(T* a, int k, int n) {
    while (2 * k <= n) {
        int j = 2 * k;
        if (j < n && a[j - 1] < a[j]) j++;     // larger child
        if (!(a[k - 1] < a[j - 1])) break;
        std::swap(a[k - 1], a[j - 1]);
        k = j;
    }
}
template <typename T>
void heapSort(T* a, int n) {
    for (int k = n / 2; k >= 1; k--) sink(a, k, n);   // construction, O(n)
    while (n > 1) {                                    // sortdown, O(n log n)
        std::swap(a[0], a[n - 1]);                     // exch(a, 1, n--)
        n--;
        sink(a, 1, n);
    }
}
```

运行输出（驱动程序把 `mystery4` 限制在 n = 20，所以 n ≥ 20 的每一行最后一列都是 21 次调用；所有排序还检查过在已排序、逆序和全相等输入上都能得到有序结果）：

```text
== Q3 circular SLL
12 99 37 (count 3)
removeLast -> 37  12 99 (count 2)
addFirst(5): 5 12 99 (count 3)
removeFirst -> 5  12 99 (count 2)
removeLast -> 12  (count 0)
empty: removeLast on empty list
== Q4 stack with one queue
peek 3 pops: 3241 | pop-costly: 321 | two queues: 321
== queue with one stack (recursion)
1234
== circular array with resize
1 cap=4 order: 2 3 4
heap construction [2,9,7,6,5,8] -> 9 6 8 2 5 7
== mystery counts
n=8: 16 3 63 9
n=16: 32 4 255 17
n=1000: 2000 10 999999 21
```

---

## 16. 速查与考前清单

**必须熟记的成本**

| 结构 | O(1) | O(n) | 备注 |
|---|---|---|---|
| ArrayList | get/set，末尾 add/remove（均摊） | 按下标或前端 add/remove | 扩容 ×2 / 占用 ¼ 时缩容 ÷2 |
| SLL（head） | 前端 add/remove | 末尾或按下标的任何操作 | |
| SLL（head + tail） | 前端 add/remove，**末尾 add** | **末尾 remove** | |
| DLL（head + tail） | 两端 add/remove | 按下标操作 | |
| 循环数组队列/双端队列 | 两端（配合扩容为均摊） | 扩容复制 | 从 `front` 开始展开 |
| 由 1 或 2 个队列实现的栈 | pop、peek | push（或另一种设计的反向） | |
| 由 2 个栈实现的队列 | enqueue；dequeue 均摊 | dequeue 最坏情况 | 仅当 out 为空时才转移 |
| 二叉堆 | max | | insert / delMax 为 O(log n)；建堆为 O(n) |
| BST | | 最坏情况（棍子）下查找 / 插入 / 删除 | 平均：查找、插入 O(log n)，Hibbard 删除 O(√n)；中序 = 有序 |
| 任意树的遍历 | | O(n) | 递归使用 O(高度) 的栈空间 |

**考前清单**

- [ ] 凭记忆写出大 O 阶梯，并对一组混合的函数排序。
- [ ] 数清 `i *= 2`、`i < n*n`、嵌套的 `j < i`，以及外层倍增的陷阱。
- [ ] 求解 T(n − 1) + c、T(n − 1) + n、T(n/2) + c、2T(n/2) + n。
- [ ] 解释为什么 ×2 增长是均摊 O(1)，而 +k 增长是 O(n)。
- [ ] 在带 tail 的循环 SLL 上写出 `removeLast` / `removeFirst` / `addFirst`，先处理特殊情况。
- [ ] 写出由一个队列实现的栈（两种设计），以及由两个栈实现的队列，并附上追踪表。
- [ ] 写出循环数组四种双端队列操作的下标公式，以及扩容时的展开。
- [ ] 根据快照识别排序算法；比较在已排序、逆序和全相等输入上的比较次数。
- [ ] 用 Hoare 方案手工对数组进行划分。
- [ ] 手工对堆做插入与 delMax（数组和树两种形式）；自底向上建堆并解释为什么是 O(n)。
- [ ] 列出树的前序、中序、后序和层序；深度与高度；满与完全。
- [ ] 由前序与中序重建二叉树（Quiz 4）。
- [ ] 手工完成 BST 的查找、插入以及 Hibbard 删除的三种情形；解释为什么有序插入会形成“棍子”。
- [ ] `unique_ptr` 的移动、`shared_ptr` 的循环、行优先的地址公式。

### 最需记住的 5 点

1. 期中考试就是样题的五类题型，只是细节有所改变——先找出变化的细节，并写下你的假设。
2. 每个复杂度答案都要写明情形（最坏 / 均摊）以及一行的理由。
3. 在单链表中，tail 指针让**添加**到末尾为 O(1)，但无法让**删除**末尾为 O(1)；只有 `prev` 能解决这个问题。
4. 由一种结构构建另一种结构：把昂贵的工作放在一个操作中，并让你的复杂度答案与你写出的设计保持一致。
5. 对有序输入：插入排序 O(n)，选择排序 O(n²)，归并排序 O(n log n)，以第一个元素为枢轴的快速排序 O(n²)；由已排序键构建的 BST 是一根“棍子”，其操作代价为 O(n)。
