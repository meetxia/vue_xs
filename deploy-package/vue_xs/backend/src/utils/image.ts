import * as sharp from 'sharp'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 图片处理配置
 */
export const IMAGE_CONFIG = {
  // 缩略图尺寸
  thumbnail: {
    width: 200,
    height: 200
  },
  
  // 封面尺寸
  cover: {
    width: 800,
    height: 1200
  },
  
  // 头像尺寸
  avatar: {
    width: 300,
    height: 300
  },
  
  // 压缩质量
  quality: {
    jpeg: 85,
    png: 90,
    webp: 85
  }
}

/**
 * 图片压缩
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径
 * @param quality 压缩质量 (0-100)
 */
export async function compressImage(
  inputPath: string,
  outputPath?: string,
  quality: number = 85
): Promise<string> {
  try {
    const output = outputPath || inputPath
    const ext = path.extname(inputPath).toLowerCase()
    
    let pipeline = sharp(inputPath)
    
    // 根据文件类型选择压缩方式
    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality })
    } else if (ext === '.png') {
      pipeline = pipeline.png({ quality })
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality })
    }
    
    await pipeline.toFile(output)
    return output
  } catch (error) {
    throw new Error('图片压缩失败')
  }
}

/**
 * 生成缩略图
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径
 * @param width 宽度
 * @param height 高度
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  width: number = IMAGE_CONFIG.thumbnail.width,
  height: number = IMAGE_CONFIG.thumbnail.height
): Promise<string> {
  try {
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: IMAGE_CONFIG.quality.jpeg })
      .toFile(outputPath)
    
    return outputPath
  } catch (error) {
    throw new Error('缩略图生成失败')
  }
}

/**
 * 调整图片尺寸
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径
 * @param width 宽度
 * @param height 高度
 */
export async function resizeImage(
  inputPath: string,
  outputPath: string,
  width: number,
  height?: number
): Promise<string> {
  try {
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(outputPath)
    
    return outputPath
  } catch (error) {
    throw new Error('图片调整失败')
  }
}

/**
 * 裁剪图片
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径
 * @param width 宽度
 * @param height 高度
 * @param x 起始X坐标
 * @param y 起始Y坐标
 */
export async function cropImage(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number,
  x: number = 0,
  y: number = 0
): Promise<string> {
  try {
    await sharp(inputPath)
      .extract({ left: x, top: y, width, height })
      .toFile(outputPath)
    
    return outputPath
  } catch (error) {
    throw new Error('图片裁剪失败')
  }
}

/**
 * 图片转换格式
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径
 * @param format 目标格式 (jpeg, png, webp)
 */
export async function convertImageFormat(
  inputPath: string,
  outputPath: string,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg'
): Promise<string> {
  try {
    let pipeline = sharp(inputPath)
    
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: IMAGE_CONFIG.quality.jpeg })
        break
      case 'png':
        pipeline = pipeline.png({ quality: IMAGE_CONFIG.quality.png })
        break
      case 'webp':
        pipeline = pipeline.webp({ quality: IMAGE_CONFIG.quality.webp })
        break
    }
    
    await pipeline.toFile(outputPath)
    return outputPath
  } catch (error) {
    throw new Error('图片格式转换失败')
  }
}

/**
 * 获取图片信息
 * @param inputPath 输入文件路径
 */
export async function getImageInfo(inputPath: string): Promise<{
  width: number
  height: number
  format: string
  size: number
}> {
  try {
    const metadata = await sharp(inputPath).metadata()
    const stats = fs.statSync(inputPath)
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stats.size
    }
  } catch (error) {
    throw new Error('获取图片信息失败')
  }
}

/**
 * 处理头像图片
 * - 压缩到指定尺寸
 * - 裁剪为正方形
 * - 压缩质量
 */
export async function processAvatar(
  inputPath: string,
  outputPath?: string
): Promise<string> {
  try {
    const output = outputPath || inputPath
    
    await sharp(inputPath)
      .resize(IMAGE_CONFIG.avatar.width, IMAGE_CONFIG.avatar.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: IMAGE_CONFIG.quality.jpeg })
      .toFile(output)
    
    return output
  } catch (error) {
    throw new Error('头像处理失败')
  }
}

/**
 * 处理封面图片
 * - 压缩到指定尺寸
 * - 保持宽高比
 * - 压缩质量
 */
export async function processCover(
  inputPath: string,
  outputPath?: string
): Promise<string> {
  try {
    const output = outputPath || inputPath
    
    await sharp(inputPath)
      .resize(IMAGE_CONFIG.cover.width, IMAGE_CONFIG.cover.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: IMAGE_CONFIG.quality.jpeg })
      .toFile(output)
    
    return output
  } catch (error) {
    throw new Error('封面处理失败')
  }
}

/**
 * 批量处理图片
 * @param inputPaths 输入文件路径数组
 * @param processor 处理函数
 */
export async function batchProcessImages(
  inputPaths: string[],
  processor: (inputPath: string, outputPath: string) => Promise<string>
): Promise<string[]> {
  const results: string[] = []
  
  for (const inputPath of inputPaths) {
    try {
      const outputPath = inputPath.replace(
        path.extname(inputPath),
        '_processed' + path.extname(inputPath)
      )
      const result = await processor(inputPath, outputPath)
      results.push(result)
    } catch (error) {
      console.error(`处理图片失败: ${inputPath}`, error)
    }
  }
  
  return results
}

