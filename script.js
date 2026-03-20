// 获取按钮元素（通过id）
const btn = document.getElementById('btn');

// 给按钮添加点击事件
btn.addEventListener('click', function() {
    // 弹出提示框
    alert('你点击了按钮！这是JS实现的交互效果～');
    // 也可以修改页面内容，比如：
    // document.querySelector('#about p').textContent = '点击按钮后文字变啦！';
});