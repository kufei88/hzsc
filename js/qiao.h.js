var qiao = {};
qiao.on = function(obj, event, func){
	$(document).off(event, obj).on(event, obj, func);
};
qiao.juicer = function(el, data, callback){
	if(el){
		var $tpl = $(el);
		$tpl.after(juicer($tpl.html(), data));
		if(callback) callback();
	}
};

qiao.h = {};
// page相关
qiao.h.normalStyle = {top:'0px',bottom:0};
qiao.h.centerStyle = {top:'45px',bottom:'50px'};
qiao.h.normalPage = function(id, options){
	var opt = $.extend({}, options, qiao.h.normalStyle);
	return qiao.h.page(id, {styles : opt});
};
qiao.h.centerPage = function(id, options){
	var opt = $.extend({}, options, qiao.h.normalStyle);
	return qiao.h.page(id, {styles : opt});
};
qiao.h.page = function(id, options){
	var url = id + '.html';
	
	options.id = id;
	options.url = url;
	return options;
};
qiao.h.indexPage = function(){
	return plus.webview.getWebviewById(plus.runtime.appid);
};
qiao.h.currentPage = function(){
	return plus.webview.currentWebview();
};
qiao.h.getPage = function(id){
	return id ? plus.webview.getWebviewById(id) : null;
};
qiao.h.show = function(id, ani, time, func){
	if(id) plus.webview.show(id, ani, time, func);
};
qiao.h.hide = function(id, ani, time){
	if(id) plus.webview.hide(id, ani, time);
};
qiao.h.fire = function(id, name, values){
	mui.fire(qiao.h.getPage(id), name, values);
};

qiao.h.open = function(id,name,parameters){
	mui.openWindow({
							url: name,
							id: id,
							preload: false,
							show: {
								aniShow: 'pop-in'
							},
							styles: {
								popGesture: 'hide'
							},
							extras:parameters,
							waiting: {
								autoShow: false
							}
						});
};

qiao.h.formatdate = function(date){
	return date<10?'0'+date:date;
}

// 以下为UI封装------------------------------------------------------------------------------
// qiao.h.tip
qiao.h.tip = function(msg, options){
	plus.nativeUI.toast(msg,options);
};

// qiao.h.waiting
qiao.h.waiting = function(titile, options){
	plus.nativeUI.showWaiting(titile, options);
};
qiao.h.closeWaiting = function(){
	plus.nativeUI.closeWaiting();
};

//print
qiao.h.print = function(string,billcode){
	mac_address = qiao.h.getItem('打印机');
		if(!mac_address) {
			mui.toast('请选择蓝牙打印机');
			return;
		}
	//	try
	//	{
		var main = plus.android.runtimeMainActivity();
		var BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter");
		var UUID = plus.android.importClass("java.util.UUID");
		var uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
		var BAdapter = BluetoothAdapter.getDefaultAdapter();
		var device = BAdapter.getRemoteDevice(mac_address);
		plus.android.importClass(device);
		var bluetoothSocket = device.createInsecureRfcommSocketToServiceRecord(uuid);
		plus.android.importClass(bluetoothSocket);

		if(!bluetoothSocket.isConnected()) {
			console.log('检测到设备未连接，尝试连接....');
			bluetoothSocket.connect();
		}

		console.log('设备已连接');
		
		
		if(bluetoothSocket.isConnected()) {
			var outputStream = bluetoothSocket.getOutputStream();
			plus.android.importClass(outputStream);
			
			
			var bytes = plus.android.invoke(string, 'getBytes', 'gbk');
			console.log(billcode);
			var bar = plus.android.invoke(billcode, 'getBytes', 'gbk');
			console.log(bar.length);
			var printnumber = qiao.h.getItem('打印份数')?qiao.h.getItem('打印份数'):'1';
			  
        	var moduleSize = 8;
			var oneCode = [0x1b, 97, 2];
			
			for(var i=0;i<printnumber;i++){
				outputStream.write(bytes);
				outputStream.flush();
				outputStream.write(29);
				outputStream.write(72);
				outputStream.write(2);
				
				outputStream.flush();    //hri字符打印位置
				outputStream.write(29);
				outputStream.write(119);
				outputStream.write(2);
				
				outputStream.flush();    //条码宽度
				outputStream.write(29);
				outputStream.write(104);
				outputStream.write(81);
				
				outputStream.flush();  //条码高度
				
				outputStream.write(29);
			    outputStream.write(107);   //打印条码
		        outputStream.write(73);   // 条码类型   code128
		        outputStream.write(15);   //  条码位数
		                 
		        outputStream.write(123);      
		        outputStream.write(66);    //code128 的子类型，有128a,128b,128c
		        outputStream.write(bar);
		        outputStream.flush();
		       
		    //    outputStream.write(78);  
		  
		   //     outputStream.write(111);  
		    //    outputStream.write("(k");  
		  //      outputStream.write(46);  
		  //      outputStream.write(123);  
		  //      outputStream.write(67);  
		   //     outputStream.write(12);  
		   //     outputStream.write(34);  
		  
		    //    outputStream.write(56);  
		    
		        
				
				
				console.log(111);
			}
			
			outputStream.flush();
			device = null //这里关键
			bluetoothSocket.close(); //必须关闭蓝牙连接否则意外断开的话打印错误

		}
	//	}
	//	catch(err){
	//		mui.alert('打印失败，请重启打印机!!');
	//		return;
	//	}
}

// popover
qiao.h.pop = function(){
	mui('.mui-popover').popover('toggle');
};

// actionsheet
qiao.h.sheet = function(title, btns,func){
	if(title && btns && btns.length > 0){
		var btnArray = [];
		for(var i=0; i<btns.length; i++){
			btnArray.push({title:btns[i]});
		}
		
		plus.nativeUI.actionSheet({
			title : title,
			cancel : '取消',
			buttons : btnArray
		}, function(e){
			if(func) func(e);
		});
	}
};

// 提示框相关
qiao.h.modaloptions = {
	title 	: 'title',
	abtn	: '确定',
	cbtn	: ['确定','取消'],
	content	: 'content'
};
qiao.h.alert = function(options, ok){
	var opt = $.extend({}, qiao.h.modaloptions);
	
	opt.title = '提示';
	if(typeof options == 'string'){
		opt.content = options;
	}else{
		$.extend(opt, options);
	}
	
	plus.nativeUI.alert(opt.content, function(e){
		if(ok) ok();
	}, opt.title, opt.abtn);
};
qiao.h.confirm = function(options, ok, cancel){
	var opt = $.extend({}, qiao.h.modaloptions);
	
	opt.title = '确认操作';
	if(typeof options == 'string'){
		opt.content = options;
	}else{
		$.extend(opt, options);
	}
	
	plus.nativeUI.confirm(opt.content, function(e){
		var i = e.index;
		if(i == 0 && ok) ok();
		if(i == 1 && cancel) cancel();
	}, opt.title, opt.cbtn);
};
qiao.h.prompt = function(options, ok, cancel){
	var opt = $.extend({}, qiao.h.modaloptions);
	
	opt.title = '输入内容';
	if(typeof options == 'string'){
		opt.content = options;
	}else{
		$.extend(opt, options);
	}
	
	plus.nativeUI.prompt(opt.content, function(e){
		var i = e.index;
		if(i == 0 && ok) ok(e.value);
		if(i == 1 && cancel) cancel(e.value);
	}, opt.title, opt.content, opt.cbtn);
};

// 以下为插件封装------------------------------------------------------------------------------
// 本地存储相关
qiao.h.length = function(){
	
	return plus.storage.getLength();
};
qiao.h.key = function(i){
	return plus.storage.key(i);
};
qiao.h.getItem = function(key){
	if(key){
		key = 'hzsc'+key;
		return plus.storage.getItem(key);
		

	}
	
	return null;
};
qiao.h.insertItem = function(key, value){
	key = 'hzsc'+key;
	plus.storage.setItem(key, value);
};
qiao.h.delItem = function(key){
	key = 'hzsc'+key;
	plus.storage.removeItem(key);
};
qiao.h.clear = function(){
	plus.storage.clear();
};

// web sql
qiao.h.db = function(name, size){
	var db_name = name ? name : 'db_test';
	var db_size = size ? size : 2;
	
	return openDatabase(db_name, '1.0', 'db_test', db_size * 1024 * 1024);
};
qiao.h.update = function(db, sql,func){
	
	if(db &&sql){
		db.transaction(function(tx){tx.executeSql(sql,[],function(tx,results){
			
			if(typeof(func)=='function'){
				func(results);
				};
		},
			function(tx,error){alert('创建stu表失败:' + error.message);});});
	}
};
qiao.h.query = function(db, sql, func){
	if(db && sql){
		db.transaction(function(tx){
			tx.executeSql(sql, [], function(tx, results) {
				func(results);
			}, function(tx,error){
				console.log(error.message);
			});
		});
	}
};

// 以下为功能封装------------------------------------------------------------------------------
// 退出
qiao.h.exit = function(){
	qiao.h.confirm('确定要退出吗？', function(){
		plus.runtime.quit();
	});
};
// 刷新
qiao.h.endDown = function(selector){
	var sel = selector ? selector : '#refreshContainer';
	mui(sel).pullRefresh().endPulldownToRefresh();
};

// init
var db = qiao.h.db();