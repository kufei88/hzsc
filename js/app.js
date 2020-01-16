/**
 * 演示程序当前的 “注册/登录” 等操作，是基于 “本地存储” 完成的
 * 当您要参考这个演示程序进行相关 app 的开发时，
 * 请注意将相关方法调整成 “基于服务端Service” 的实现。
 **/
(function($, owner) {
	owner.getNowDate = function(){
		var now = new Date();
		return now.getFullYear() + '-' + qiao.h.formatdate(now.getMonth() + 1) +
			'-' + qiao.h.formatdate(now.getDate());
	}
	owner.getNowMinutes = function(){
		var now = new Date();
		return now.getFullYear() + '-' + qiao.h.formatdate(now.getMonth() + 1) +
			'-' + qiao.h.formatdate(now.getDate())+' '+qiao.h.formatdate(now.getHours())+':'+
			qiao.h.formatdate(now.getMinutes())+':'+qiao.h.formatdate(now.getSeconds())+':'+
			qiao.h.formatdate(now.getMilliseconds());
	}
	owner.selectDate = function(defaultDate,result){
		
			var dDate = new Date(defaultDate);
		//dDate.setFullYear(2014, 7, 16);
			var minDate = new Date();
			minDate.setFullYear(1986, 09, 19);
			var maxDate = new Date();
			maxDate.setFullYear(2086, 09, 19);
			
			
			plus.nativeUI.pickDate(function(e) {
				var d = e.date;
				result(d.getFullYear() + "-" + qiao.h.formatdate(d.getMonth() + 1) + "-" + qiao.h.formatdate(d.getDate()));
				//result.innerText = d.getFullYear() + "-" + qiao.h.formatdate(d.getMonth() + 1) + "-" + qiao.h.formatdate(d.getDate());
				//info.innerText = '您选择的日期是:' + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
			}, function(e) {
				info.innerText = "您没有选择日期";
			}, {
				title: "请选择日期",
				date: dDate,
				minDate: minDate,
				maxDate: maxDate
			});
		
		
	}
	owner.postData = function(url, data1, callback) {  
		var wd = plus.nativeUI.showWaiting();
        var settings = owner.getSettings();
		var address = settings.address ? settings.address : '';
		var account = settings.account ? settings.account : '';
		var port = settings.port ? settings.port : '';
		var url1 = 'http://' + address + ':' + port +'/PSSWeb/'+ url;
		data1.databaseName = account;
	    $.ajax(url1,{  
	        data:data1,
	        dataType:'json',  
	        type:'post',  
	        contentType:"application/x-www-form-urlencoded; charset=utf-8",  
	        timeout:60000,  
	        
	        success:function(data){
	        	if(wd){
	        		wd.close();  
	        	}
	        	callback(data);
	        },
	        error:function(xhr,type,errorThrown){  
	        	console.log(errorThrown);
	        	console.log(url);
	        	if(wd){
	        		wd.close();  
	        	}
	            
	            mui.alert("<网络连接失败，请重新尝试一下>", "错误", "OK", null);  
	        }  
	    });  
    }; 
    
    owner.getData = function(url, data1, callback) {  
		var wd = plus.nativeUI.showWaiting();
        var settings = owner.getSettings();
		var address = settings.address ? settings.address : '';
		
		var port = settings.port ? settings.port : '';
		var url1 = 'http://' + address + ':' + port +'/PSSWeb/'+ url;
		
	    $.ajax(url1,{  
	        data:data1,
	        dataType:'json',  
	        type:'get',  
	        contentType:"application/x-www-form-urlencoded; charset=utf-8",  
	        timeout:60000,  
	        
	        success:function(data){
	        	if(wd){
	        		wd.close();  
	        	}
	        	callback(data);
	        },
	        error:function(xhr,type,errorThrown){  
	        	console.log(errorThrown);
	        	console.log(url);
	        	if(wd){
	        		wd.close();  
	        	}
	            
	            mui.alert("<网络连接失败，请重新尝试一下>", "错误", "OK", null);  
	        }  
	    });  
    }; 
    
    owner.getSyncData = function(url, data1, callback) {  
		var wd = plus.nativeUI.showWaiting();
        var settings = owner.getSettings();
		var address = settings.address ? settings.address : '';
		
		var port = settings.port ? settings.port : '';
		var url1 = 'http://' + address + ':' + port +'/PSSWeb/'+ url;
		
	    $.ajax(url1,{  
	        data:data1,
	        dataType:'json',  
	        type:'get',  
	        async:false,
	        contentType:"application/x-www-form-urlencoded; charset=utf-8",  
	        timeout:60000,  
	        
	        success:function(data){
	        	if(wd){
	        		wd.close();  
	        	}
	        	callback(data);
	        },
	        error:function(xhr,type,errorThrown){  
	        	console.log(errorThrown);
	        	console.log(url);
	        	if(wd){
	        		wd.close();  
	        	}
	            
	            mui.alert("<网络连接失败，请重新尝试一下>", "错误", "OK", null);  
	        }  
	    });  
    }; 
	
	owner.login = function(loginInfo, callback) {
		callback = callback || $.noop;
		loginInfo = loginInfo || {};
		loginInfo.account = loginInfo.account || '';
		loginInfo.password = loginInfo.password || '';
		if (loginInfo.account.length < 5) {
			return callback('账号最短为 5 个字符');
		}
		if (loginInfo.password.length < 6) {
			return callback('密码最短为 6 个字符');
		}
		var users = JSON.parse(localStorage.getItem('$users') || '[]');
		var authed = users.some(function(user) {
			return loginInfo.account == user.account && loginInfo.password == user.password;
		});
		if (authed) {
			return owner.createState(loginInfo.account, callback);
		} else {
			return callback('用户名或密码错误');
		}
	};

	owner.createState = function(name, callback) {
		var state = owner.getState();
		state.account = name;
		state.token = "token123456789";
		owner.setState(state);
		return callback();
	};

	/**
	 * 新用户注册
	 **/
	owner.reg = function(regInfo, callback) {
		callback = callback || $.noop;
		regInfo = regInfo || {};
		regInfo.account = regInfo.account || '';
		regInfo.password = regInfo.password || '';
		if (regInfo.account.length < 5) {
			return callback('用户名最短需要 5 个字符');
		}
		if (regInfo.password.length < 6) {
			return callback('密码最短需要 6 个字符');
		}
		if (!checkEmail(regInfo.email)) {
			return callback('邮箱地址不合法');
		}
		var users = JSON.parse(localStorage.getItem('$users') || '[]');
		users.push(regInfo);
		localStorage.setItem('$users', JSON.stringify(users));
		return callback();
	};

	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
		//var settings = owner.getSettings();
		//settings.gestures = '';
		//owner.setSettings(settings);
	};

	var checkEmail = function(email) {
		email = email || '';
		return (email.length > 3 && email.indexOf('@') > -1);
	};

	/**
	 * 找回密码
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if (!checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
	};

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$hzscsettings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
			var settingsText = localStorage.getItem('$hzscsettings') || "{}";
			return JSON.parse(settingsText);
		}
		/**
		 * 获取本地是否安装客户端
		 **/
	owner.isInstalled = function(id) {
		if (id === 'qihoo' && mui.os.plus) {
			return true;
		}
		if (mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var packageManager = main.getPackageManager();
			var PackageManager = plus.android.importClass(packageManager)
			var packageName = {
				"qq": "com.tencent.mobileqq",
				"weixin": "com.tencent.mm",
				"sinaweibo": "com.sina.weibo"
			}
			try {
				return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
			} catch (e) {}
		} else {
			switch (id) {
				case "qq":
					var TencentOAuth = plus.ios.import("TencentOAuth");
					return TencentOAuth.iphoneQQInstalled();
				case "weixin":
					var WXApi = plus.ios.import("WXApi");
					return WXApi.isWXAppInstalled()
				case "sinaweibo":
					var SinaAPI = plus.ios.import("WeiboSDK");
					return SinaAPI.isWeiboAppInstalled()
				default:
					break;
			}
		}
	}
}(mui, window.app = {}));