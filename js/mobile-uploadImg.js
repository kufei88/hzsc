/**
 * @filename mobile-uploadImg
 * @description
 * 作者: 418239385(418239385@qq.com)
 * 创建时间: 2016-4-6 14:38:03
 * 修改记录:
 *
 **/
//------------------------------------------------------------------------------
function mobileUploadImg(opts)
{
    if(opts == null){
        objGlobal.DIC.dialog({content:'请配置上传图片的相关参数！', autoClose:false, okValue:"确定", isMask:true});
        return;
    }
    var objUploadImg = {};
    var opts = opts || {};
    //上传图片的表单ID
    objUploadImg.formHtmlId = opts.formHtmlId || "";
    //最大上传图片量
    objUploadImg.maxUpload = opts.maxUpload || 8;
    //生成图片的最大宽度
    objUploadImg.uploadMaxW = opts.uploadMaxW || 800;
    //生成图片的最大高度
    objUploadImg.uploadMaxH = opts.uploadMaxH || 800;
    //目标jpg图片输出质量
    objUploadImg.uploadQuality = opts.uploadQuality || 1;
    //上传限制图片体积(MB)   默认8M
    objUploadImg.uploadPicSize = opts.uploadPicSize || 8;
    //是否允许多图上传  默认单张上传
    objUploadImg.uploadPicMore = opts.uploadPicMore || false;
    //多图上传时，一次上传的最大张数 默认10
    objUploadImg.onceMaxUpload = opts.onceMaxUpload || 10;
    // 上传图片地址
    objUploadImg.uploadUrl = opts.uploadUrl || "";
    //压缩图片时的默认图片地址
    objUploadImg.uploadDefaultImgUrl = opts.uploadDefaultImgUrl || "";
    //多图上传时，上传第一张到最后一张的状态
    objUploadImg.isMoreBusy = false;
    // 上传信息 主要是 id 对应信息
    objUploadImg.uploadInfo = {};
    // 上传队列，里面保存的是 id
    objUploadImg.uploadQueue = [];
    // 预览队列，里面保存的是 id
    objUploadImg.previewQueue = [];
    // 请求对象
    objUploadImg.xhr = {};
    // 是否有图片正在压缩
    objUploadImg.isEncoderBusy = false;
    // 是否有任务正在上传
    objUploadImg.isBusy = false;

    if(objUploadImg.formHtmlId.length <= 0){
        objGlobal.DIC.dialog({content:'请配置上传图片的容器ID！', autoClose:false, okValue:"确定", isMask:true});
        return;
    }

    if(objUploadImg.uploadUrl.length <= 0){
        objGlobal.DIC.dialog({content:'请配置上传图片的URL地址！', autoClose:false, okValue:"确定", isMask:true});
        return;
    }

    objUploadImg.countUpload = function() {
        var num = 0;
        $.each(objUploadImg.uploadInfo, function(i, n) {
            if (n) {
                ++ num;
            }
        });
        return num;
    };

    // 图片预览
    objUploadImg.uploadPreview = function(id) {
        var reader = new FileReader();

        var uploadBase64;
        var conf = {}, file = objUploadImg.uploadInfo[id].file;

        conf = {
            maxW: objUploadImg.uploadMaxW, //目标宽
            maxH: objUploadImg.uploadMaxH, //目标高
            quality: objUploadImg.uploadQuality, //目标jpg图片输出质量
        };

        reader.onload = function(e) {
            var result = this.result;

            // 如果是jpg格式图片，读取图片拍摄方向,自动旋转
            if (file.type == 'image/jpeg'){
                try {
                    var jpg = new objJpegMeata.JpegMeta.JpegFile(result, file.name);
                } catch (e) {
                    objGlobal.DIC.dialog({content:'图片不是正确的图片数据', autoClose:true});
                    $(objUploadImg.formHtmlId + ' #li' + id).remove();
                    objUploadImg.isEncoderBusy = false;
                    return false;
                }
                if (jpg.tiff && jpg.tiff.Orientation) {
                    //设置旋转
                    conf = $.extend(conf, {
                        orien: jpg.tiff.Orientation.value
                    });
                }
            }

            // 压缩
            if (objImageCompresser.ImageCompresser.support()) {
                var img = new Image();
                img.onload = function() {
                    try {
                        uploadBase64 = objImageCompresser.ImageCompresser.getImageBase64(this, conf);
                    } catch (e) {
                        objGlobal.DIC.dialog({content:'压缩图片失败', autoClose:true});
                        $(objUploadImg.formHtmlId + ' #li' + id).remove();
                        objUploadImg.isEncoderBusy = false;
                        return false;
                    }
                    if (uploadBase64.indexOf('data:image') < 0) {
                        objGlobal.DIC.dialog({content:'上传照片格式不支持', autoClose:true});
                        $(objUploadImg.formHtmlId + ' #li' + id).remove();
                        objUploadImg.isEncoderBusy = false;
                        return false;
                    }

                    objUploadImg.uploadInfo[id].file = uploadBase64;
                    $(objUploadImg.formHtmlId + ' #li' + id).find('img').attr('src', uploadBase64);
                    objUploadImg.uploadQueue.push(id);
                }
                img.onerror = function() {
                    objGlobal.DIC.dialog({content:'解析图片数据失败', autoClose:true});
                    $(objUploadImg.formHtmlId + ' #li' + id).remove();
                    objUploadImg.isEncoderBusy = false;
                    return false;
                }
                img.src = objImageCompresser.ImageCompresser.getFileObjectURL(file);
            } else {
                uploadBase64 = result;
                if (uploadBase64.indexOf('data:image') < 0) {
                    objGlobal.DIC.dialog({content:'上传照片格式不支持', autoClose:true});
                    $(objUploadImg.formHtmlId + ' #li' + id).remove();
                    objUploadImg.isEncoderBusy = false;
                    return false;
                }

                objUploadImg.uploadInfo[id].file = uploadBase64;
                $(objUploadImg.formHtmlId + ' #li' + id).find('img').attr('src', uploadBase64);
                objUploadImg.uploadQueue.push(id);
            }
        }

        reader.readAsBinaryString(objUploadImg.uploadInfo[id].file);
    };

    // 创建上传请求
    objUploadImg.createUpload = function(id, type, uploadTimer) {
        if (!objUploadImg.uploadInfo[id]) {
            objUploadImg.isEncoderBusy = false;
            objUploadImg.isBusy = false;
            return false;
        }
        // 移除图片压缩中...
        $(objUploadImg.formHtmlId + ' #li' + id).find('.mbupload_maskTxt').remove();

        // 图片posturl
        var uploadUrl = objUploadImg.uploadUrl;
        // 产生进度条
        var progressHtml = '<div class="mbupload_progress mbupload_brSmall" id="mbupload_progress'+id+'"><div class="mbupload_proBar" style="width:0%;"></div></div>';
        $(objUploadImg.formHtmlId + ' #li' + id).find('.mbupload_maskLay').after(progressHtml);

        var formData = new FormData();
        formData.append('upload_pic', objUploadImg.uploadInfo[id].file);
        formData.append('upload_name', objUploadImg.uploadInfo[id].oldFileInfo.name);
        formData.append('upload_id', id);

        var progress = function(e) {
            if (e.target.response) {
                var result = $.parseJSON(e.target.response);

                if (result.errCode != 0) {
                    // $('#content').val(result.errCode);
                    objGlobal.DIC.dialog({content:'网络不稳定，请稍后重新操作', autoClose:true});
                    removePic(id);
                    //更新剩余上传数
                    objUploadImg.uploadRemaining();
                    return false;
                }
            }

            var progress = $(objUploadImg.formHtmlId + ' #mbupload_progress' + id).find('.mbupload_proBar');
            if (e.total == e.loaded) {
                var percent = 100;
            } else {
                var percent = 100*(e.loaded / e.total);
            }

            // 控制进度条不要超出
            if (percent > 100) {
                percent = 100;
            }

            progress.width(percent + '%');
            //progress.animate({'width': '95%'}, 1500);

            setTimeout(function(){
                if (percent == 100) {
                    donePic(id);
                    var pLength = 0, nLength = 0;
                    if(objUploadImg.uploadPicMore){
                        pLength = objUploadImg.previewQueue.length;
                        nLength = objUploadImg.uploadQueue.length;
                    }
                    if(uploadTimer && pLength <= 0 && nLength <= 0){
                        clearInterval(uploadTimer);
                    }
                }
            }, 400);
        }

        var removePic = function(id) {
            donePic(id);
            $('#li' + id).remove();
        }

        var donePic = function(id) {
            objUploadImg.isEncoderBusy = false;
            objUploadImg.isBusy = false;
            if(objUploadImg.uploadPicMore && (objUploadImg.previewQueue.length <= 0) &&
                 (objUploadImg.uploadQueue.length <= 0)){
                objUploadImg.isMoreBusy = false;
            }
            if (typeof objUploadImg.uploadInfo[id] != 'undefined') {
                objUploadImg.uploadInfo[id].isDone = true;
            }
            if (typeof objUploadImg.xhr[id] != 'undefined') {
                objUploadImg.xhr[id] = null;
            }
        }

        var complete = function(e) {
            var progress = $(objUploadImg.formHtmlId + ' #mbupload_progress' + id).find('.mbupload_proBar');
            progress.css('width', '100%');
            if($(objUploadImg.formHtmlId + ' #li' + id)){
                $(objUploadImg.formHtmlId + ' #li' + id).find('.mbupload_maskTxt').remove();
            }
            $(objUploadImg.formHtmlId + ' #li' + id).find('.mbupload_maskLay').remove();
            $(objUploadImg.formHtmlId + ' #li' + id).find('.mbupload_progress').remove();
            // 上传结束
            donePic(id);

            var result = $.parseJSON(e.target.response);
            if (result.errCode == 0) {
                var input = '<input type="hidden" id="input' + result.data.id + '" name="picIds[]" value="' + result.data.picId + '">';
                if(type == 'replyForm'){
                    $('#replyForm').append(input);
                }else{
                    $(objUploadImg.formHtmlId).append(input);
                }

            } else {
                objGlobal.DIC.dialog({content:'网络不稳定，请稍后重新操作', autoClose:true});
                removePic(id);
                //更新剩余上传数
                objUploadImg.uploadRemaining();
                delete objUploadImg.uploadInfo[id];
                // 如果传略失败，上传个数少于限制张数则再显示加号
                if (objUploadImg.countUpload() < objUploadImg.maxUpload) {
                    $(objUploadImg.formHtmlId + ' .mbupload_addPic').show();
                }
            }
        }

        var failed = function() {
            objGlobal.DIC.dialog({content:'网络断开，请稍后重新操作', autoClose:true});
            removePic(id)
        }

        var abort = function() {
            objGlobal.DIC.dialog({content:'上传已取消', autoClose:true});
            removePic(id)
        }

        // 创建 ajax 请求
        objUploadImg.xhr[id] = new XMLHttpRequest();
        objUploadImg.xhr[id].addEventListener("progress", progress, false);
        objUploadImg.xhr[id].upload.addEventListener("progress", progress, false);
        objUploadImg.xhr[id].addEventListener("load", complete, false);
        objUploadImg.xhr[id].addEventListener("abort", abort, false);
        objUploadImg.xhr[id].addEventListener("error", failed, false);
        objUploadImg.xhr[id].open("POST", uploadUrl);
        objUploadImg.xhr[id].send(formData);
    };

    // 不能上传系统提示
    objUploadImg.checkUploadBySysVer = function() {
        var mb_os = objGlobal.checkUA();
        if (mb_os.ios && mb_os.version.toString() < '6.0') {
            objGlobal.DIC.dialog({content:'手机系统不支持传图，请升级到ios6.0以上', autoClose:true});
            return false;
        }

        if (mb_os.wx && mb_os.wxVersion.toString() < '5.2') {
            objGlobal.DIC.dialog({content:'当前微信版本不支持传图，请升级到最新版', autoClose:true});
            return false;
        }
        return true;
    };

    //根据是否可以多图上传生成对应的input
    objUploadImg.uploadAddInput = function(){
        var input = "", fistInput = "";
        if(objUploadImg.uploadPicMore){
            input = '<input type="file" class="mbupload_on mbupload_uploadFile" accept="image/*" multiple="">';
            fistInput = '<input type="file" class="fistUpload" accept="image/*" multiple="">';
        }else{
            input = '<input type="file" class="mbupload_on mbupload_uploadFile" accept="image/*" single="">';
            fistInput = '<input type="file" class="fistUpload" accept="image/*" single="">';
        }
        $(objUploadImg.formHtmlId + ' .mbupload_addPic').append(input);
        $(objUploadImg.formHtmlId + ' .iconSendImg').append(fistInput);
    };

    //剩余上传数
    objUploadImg.uploadRemaining = function(){
        var uploadNum = 0;
        uploadNum = $(objUploadImg.formHtmlId + ' .mbupload_photoList').find('li').length;

        var canOnlyUploadNum = objUploadImg.maxUpload;
        
        if(uploadNum <= objUploadImg.maxUpload)
        {
            canOnlyUploadNum = objUploadImg.maxUpload - uploadNum + 1;
        }
        else
        {
            canOnlyUploadNum = 0;
        }

        //当上传出错则显示第一上传页面
        if(canOnlyUploadNum == objUploadImg.maxUpload)
        {
            $(objUploadImg.formHtmlId + ' .mbupload_photoList').hide();
            $(objUploadImg.formHtmlId + ' .mbupload_bgimg').show();
        }

        //更新剩余可上传图片数
        $(objUploadImg.formHtmlId + ' .mbupload_onlyUploadNum').html(canOnlyUploadNum);
    };

    // 检查图片大小
    objUploadImg.checkPicSize = function(file) {
        var uploadPicSize = objUploadImg.uploadPicSize*1024*1024;
        if (file.size > uploadPicSize) {
            return false;
        }
        return true;
    };

    // 检查图片类型
    objUploadImg.checkPicType = function(file) {
        var photoReg = (/\.png$|\.bmp$|\.jpg$|\.jpeg$|\.gif$/i);
        if(!photoReg.test(file.name)){
           return false;
        }else{
            return true;
        }
    };

    var uploadTimer = null;

    var initUpload = function()
    {
        // 上传图片的绑定
        $(objUploadImg.formHtmlId + ' .mbupload_addImg').on("click", function(){
            if(!objUploadImg.checkUploadBySysVer()){
                return false;
            }
        });

        $(objUploadImg.formHtmlId + ' .mbupload_uploadFile').on("click", function(){
            var thisObj = $(this);
            if (objUploadImg.isEncoderBusy) {
                return false;
            }
            else if (objUploadImg.isBusy) {
                objGlobal.DIC.dialog({content:'上传中，请稍后添加', autoClose:true});
                return false;
            }
            else if (objUploadImg.isMoreBusy) {
                objGlobal.DIC.dialog({content:'上传中，请稍后添加', autoClose:true});
                return false;
            }
        });

        //首次点击图片的图标，触发一次手机的默认上传事件
        $('body').on('change', objUploadImg.formHtmlId + ' .fistUpload', function(e){
            $(objUploadImg.formHtmlId + ' .mbupload_photoList').show();
            $(objUploadImg.formHtmlId + ' .mbupload_bgimg').hide();
        });

        // 文件表单发生变化时
        $('body').on('change', objUploadImg.formHtmlId + ' .mbupload_uploadFile,' + objUploadImg.formHtmlId + ' .fistUpload', function(e) {
            //执行图片预览、压缩定时器
            uploadTimer = setInterval(function() {
                // 预览
                setTimeout(function() {
                    if (!objUploadImg.isEncoderBusy && objUploadImg.previewQueue.length) {
                        var jobId = objUploadImg.previewQueue.shift();
                        objUploadImg.isEncoderBusy = true;
                        objUploadImg.uploadPreview(jobId);
                    }
                }, 1);

                // 上传
                setTimeout(function() {
                    if (!objUploadImg.isBusy && objUploadImg.uploadQueue.length) {
                        var jobId = objUploadImg.uploadQueue.shift();
                        objUploadImg.isBusy = true;
                        if(objUploadImg.uploadPicMore){
                            objUploadImg.isMoreBusy = true;
                        }
                        objUploadImg.createUpload(jobId, objUploadImg.formHtmlId, uploadTimer);
                    }
                }, 10);
            }, 300);

            e = e || window.event;
            var fileList = e.target.files;

            if (!fileList.length) {
                //更新剩余上传数
                objUploadImg.uploadRemaining();
                $(this).val('');
                return false;
            }

            if (objUploadImg.uploadPicMore && (fileList.length > objUploadImg.onceMaxUpload)) {
                objGlobal.DIC.dialog({content:'上传图片一次最多只能选' + objUploadImg.onceMaxUpload + '张', autoClose:true});
                //更新剩余上传数
                objUploadImg.uploadRemaining();
                $(this).val('');
                return false;
            }

            if (objUploadImg.uploadPicMore && (fileList.length > (objUploadImg.maxUpload - objUploadImg.countUpload()))) {
                objGlobal.DIC.dialog({content:'你最多只能上传' + objUploadImg.maxUpload + '张照片', autoClose:true});
                //更新剩余上传数
                objUploadImg.uploadRemaining();
                $(this).val('');
                return false;
            }

            for (var i = 0; i < fileList.length; i++) {
                if (objUploadImg.countUpload() >= objUploadImg.maxUpload) {
                    objGlobal.DIC.dialog({content:'你最多只能上传' + objUploadImg.maxUpload + '张照片', autoClose:true});
                    //更新剩余上传数
                    objUploadImg.uploadRemaining();
                    $(this).val('');
                    break;
                }

                var file = fileList[i];

                if (!objUploadImg.checkPicType(file)) {
                    objGlobal.DIC.dialog({content:'上传照片格式不支持', autoClose:true});
                    //更新剩余上传数
                    objUploadImg.uploadRemaining();
                    $(this).val('');
                    continue;
                }
                // console.log(file);
                if (!objUploadImg.checkPicSize(file)) {
                    objGlobal.DIC.dialog({content:'图片大小超过'+ objUploadImg.uploadPicSize + 'MB', autoClose:true});
                    //更新剩余上传数
                    objUploadImg.uploadRemaining();
                    $(this).val('');
                    continue;
                }

                var id = Date.now() + i;
                // 增加到上传对象中, 上传完成后，修改为 true
                objUploadImg.uploadInfo[id] = {
                    oldFileInfo: file,
                    file: file,
                    isDone: false,
                };

                var html = '<li id="li' + id + '"><div class="mbupload_photoCut"><img src="' + objUploadImg.uploadDefaultImgUrl + '" class="attchImg" alt="photo"></div>' +
                        '<div class="mbupload_maskLay"></div>' +
                        '<div class="mbupload_maskTxt">图片压缩中...</div>' +
                        '<a href="javascript:;" class="mbupload_cBtn mbupload_pa mbupload_db" title="" _id="'+id+'">关闭</a></li>';
                $(objUploadImg.formHtmlId + ' .mbupload_addPic').before(html);

                objUploadImg.previewQueue.push(id);

                // 图片已经上传了 最大限制 张数，隐藏 + 号
                if (objUploadImg.countUpload() >= objUploadImg.maxUpload) {
                    $(objUploadImg.formHtmlId + ' .mbupload_addPic').hide();
                }
                //更新剩余上传数
                setTimeout(function(){
                    objUploadImg.uploadRemaining();
                }, 400);
            }
            // 把输入框清空
            $(this).val('');
        });

        $(objUploadImg.formHtmlId + ' .mbupload_photoList').on('click', '.mbupload_cBtn', function() {
            var id = $(this).attr('_id');

            // 取消这个请求
            if (objUploadImg.xhr[id]) {
                objUploadImg.xhr[id].abort();
            }
            // 图片删除
            $(objUploadImg.formHtmlId + ' #li' + id).remove();
            // 表单中删除
            $(objUploadImg.formHtmlId + ' #input' + id).remove();
            objUploadImg.uploadInfo[id] = null;

            // 图片变少了，显示+号
            if (objUploadImg.countUpload() < objUploadImg.maxUpload) {
                $(objUploadImg.formHtmlId + ' .mbupload_addPic').show();
            }
            //更新剩余上传数
            objUploadImg.uploadRemaining();

            //当删除所有图片后隐藏添加图片的图标
            if($(objUploadImg.formHtmlId + ' .mbupload_photoList').find('li').length < 2){
                $(objUploadImg.formHtmlId + ' .mbupload_photoList').hide();
                $(objUploadImg.formHtmlId + ' .mbupload_bgimg').show();
            }
        });        
    };

    objUploadImg.uploadAddInput();
    objUploadImg.uploadRemaining();
    initUpload();
};