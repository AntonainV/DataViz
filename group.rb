def group(arr,num)
  new_arr = Array.new
   for i in 0..arr.length-1
    k = i%num
     new_arr[k] = Array.new if new_arr[k].nil? 
     new_arr[k].push(arr[i])
    end
    return new_arr
end
# TEST
# it assigns people 1,2,3,4 and the people have same number are in the same group
# The output should be:
# [["Jame","Apple"],["John","Banana"],["Tom"],["Mary"]]
arr = ["Jame","John","Tom","Mary","Apple","Bananna"]
num = 4
for i in 0..num-1
  puts "The group is:"
  puts group(arr,num)[i]
end