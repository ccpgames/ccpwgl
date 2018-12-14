var demos = new function()
{
    var self = this;

    this.options = {};
    try
    {
        this.options = JSON.parse(localStorage.ccpwgloptions);
    }
    catch (e)
    {
    }

    function decodeUrlOptions()
    {
        var match,
            pl = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function(s) { return decodeURIComponent(s.replace(pl, " ")); },
            query = window.location.search.substring(1);

        self.options = {};
        while (match = search.exec(query))
        {
            self.options[decode(match[1])] = decode(match[2]);
        }
    }

    function saveOptions()
    {
        localStorage.ccpwgloptions = JSON.stringify(self.options);
    }

    function onPopState(state)
    {
        if (state)
        {
            self.options = state.options || {};
        }
        decodeUrlOptions();
        saveOptions();
    }

    $(window).bind('popstate', function(event)
    {
        onPopState(event.originalEvent.state);
    });
    onPopState(history.state);

    if ('resUrl' in this.options)
    {
        ccpwgl.setResourcePath('res', this.options.resUrl);
        //this.options.resUrl = 'http://developers.eveonline.com/ccpwgl/assetpath/860161/';// window.location.protocol + '//' + window.location.host + ':8880/';
    }

    window.addEventListener('load', function()
    {
        var settings = [
            {
                label: 'Shader Quality',
                member: 'shaderQuality',
                options: [{label: 'High', value: ccpwgl.ShaderQuality.HIGH}, {
                    label: 'Low',
                    value: ccpwgl.ShaderQuality.LOW
                }]
            },
            {
                label: 'Texture Quality',
                member: 'textureQuality',
                options: [{label: 'High', value: ccpwgl.TextureQuality.HIGH}, {
                    label: 'Medium',
                    value: ccpwgl.TextureQuality.MEDIUM
                }, {label: 'Low', value: ccpwgl.TextureQuality.LOW}]
            },
            {
                label: 'Texture Filtering',
                member: 'anisotropicFilter',
                options: [{label: 'Anisotropic', value: '1'}, {label: 'Linear', value: ''}]
            },
            {
                label: 'Post-processing',
                member: 'postprocess',
                options: [{label: 'On', value: '1'}, {label: 'Off', value: ''}]
            }
        ];

        var $toolbox = $('#toolbox');
        if (!$toolbox.length)
        {
            $toolbox = $('<div id="toolbox">').appendTo($(document.body));
        }
        $toolbox.append($('<div style="width: 30px"></div><div><button data-pane="settings-pane">Settings</button></div>'));
        var $pane = $('<div id="settings-pane" class="pane"><div class="pane-heading">Settings</div></div>');
        for (var i = 0; i < settings.length; ++i)
        {
            var $select = $('<select id="setting-field-' + i + '">');
            for (var j = 0; j < settings[i].options.length; ++j)
            {
                var selected = settings[i].member in self.options && self.options[settings[i].member] == settings[i].options[j].value;
                $select.append($('<option' + (selected ? ' selected' : '') + '>').attr('value', settings[i].options[j].value).text(settings[i].options[j].label))
            }
            $pane.append($('<div>')
                .append($('<label for="setting-field-' + i + '">').text(settings[i].label))
                .append($select))
        }
        $pane.append($('<div>').append($('<button class="default">Apply</button>').click(function()
        {
            for (var i = 0; i < settings.length; ++i)
            {
                self.options[settings[i].member] = $('#setting-field-' + i).val();
            }
            saveOptions();
            location.reload();
        })));
        $(document.body).append($pane);

        $toolbox.find('button').click(function()
        {
            var id = $(this).data('pane');
            $('.pane').each(function()
            {
                var $this = $(this);
                if ($this.attr('id') == id)
                {
                    $this.toggleClass('visible');
                }
                else
                {
                    $this.removeClass('visible');
                }
            });
        });

    });
};


function softree($root, $dnaInput, loadDna, filter)
{
    filter = filter || function()
    {
        return true;
    };

    function selectDnaPart(part)
    {
        return function()
        {
            var dna = $dnaInput.val();
            var components = dna.split(':');
            var value = $(this).data('value');
            if (components.length >= 3)
            {
                components[part] = value;
            }
            else if (part == 0)
            {
                components.splice(0, 0, value);
            }
            else
            {
                components.push(value)
            }
            $dnaInput.val(components.join(':'));
        };
    }

    function getDnaPart(part)
    {
        return $dnaInput.val().split(':')[part];
    }

    function findDnaPart(part, $tree)
    {
        var dna = getDnaPart(part);
        $tree.find('a').each(function()
        {
            var $link = $(this);
            if ($link.data('value') == dna)
            {
                $tree.find('li').removeClass('expanded');
                $tree.find('a').removeClass('selected');
                $link.addClass('selected');
                while ($link.attr('id') != $tree.attr('id'))
                {
                    if ($link.prop("tagName") == 'LI')
                    {
                        $link.addClass('expanded');
                    }
                    $link = $link.parent();
                }
            }
        });
    }

    function populateTree($tree, treeName, partIndex)
    {
        return function(data)
        {
            var tree = {};
            for (var k in data)
            {
                var t = tree;
                if (data[k].indexOf('/') >= 0)
                {
                    var elements = data[k].split('/');
                    for (var i = 0; i < elements.length; ++i)
                    {
                        if (!(elements[i] in t))
                        {
                            t[elements[i]] = {};
                        }
                        t = t[elements[i]];
                    }
                }
                t[k] = k;
            }

            function select()
            {
                $tree.find('a').removeClass('selected');
                $(this).addClass('selected');
            }

            function expand()
            {
                select.apply(this);
                $(this).parent().toggleClass('expanded');
            }

            var leafClick = selectDnaPart(partIndex);

            function createNode(node, $parent, parents)
            {
                var keys = [];
                for (var k in node)
                {
                    keys.push(k);
                }
                keys.sort();
                for (var i = 0; i < keys.length; ++i)
                {
                    k = keys[i];
                    parents.push(k);
                    if (!filter(parents))
                    {
                        parents.pop();
                        continue;
                    }
                    var $a = $('<a>').text(k);
                    var $li = $('<li>').append($a);

                    $parent.append($li);
                    if (typeof node[k] != 'string')
                    {
                        $li.addClass('node');
                        $a.click(expand);
                        createNode(node[k], $('<ul>').appendTo($li), parents);
                    }
                    else
                    {
                        $li.addClass('leaf');
                        $a.click(leafClick).click(select).data('value', k);
                    }
                    parents.pop();
                }
            }

            var top = {};
            top[treeName] = tree;
            createNode(top, $tree, []);
            findDnaPart(partIndex, $tree);
        }
    }

    var $hull = $('<li>').appendTo($root);
    var $faction = $('<li>').appendTo($root);
    var $race = $('<li>').appendTo($root);

    ccpwgl.getSofHullNames(populateTree($hull, 'hull', 0));
    ccpwgl.getSofFactionNames(populateTree($faction, 'faction', 1));
    ccpwgl.getSofRaceNames(populateTree($race, 'race', 2));


    function updateState(state)
    {
        if (state)
        {
            $('#dna').val(state.dna);
            loadDna(state.dna);
            findDnaPart(0, $('#hull'));
            findDnaPart(1, $('#faction'));
            findDnaPart(2, $('#race'));
        }
    }

    $dnaInput.change(function()
    {
        findDnaPart(0, $hull);
        findDnaPart(1, $faction);
        findDnaPart(2, $race);
    });

    $(window).bind('popstate', function(event)
    {
        updateState(event.originalEvent.state);
    });

    updateState(history.state);
}

/*

     Vanilla Toasts
     https://github.com/AlexKvazos/Toasts
     @author AlexKvazos

*/

// We need DOM to be ready
if (document.readyState === 'complete')
{
    init();
}
else
{
    window.addEventListener('DOMContentLoaded', init);
}

// Create Toasts object
var Toasts = {
    // In case toast creation is attempted before dom has finished loading!
    create: function()
    {
        console.error('DOM has not finished loading.')
    },
    //function to manually set timeout after create
    setTimeout: function()
    {
        console.error('DOM has not finished loading.')
    },
    toasts: {} //store toasts to modify later
};

var autoincrement = 0;

// Initialize library
function init()
{
    // Toast container
    var container = document.createElement('div');
    container.id = 'toasts-container';
    document.body.appendChild(container);

    // @Override
    // Replace create method when DOM has finished loading
    Toasts.create = function(options)
    {
        var toast = document.createElement('div');
        toast.id = ++autoincrement;
        toast.id = 'toast-' + toast.id;
        toast.className = 'toasts-toast';

        // title
        if (options.title)
        {
            var h4 = document.createElement('h4');
            h4.className = 'toasts-title';
            h4.innerHTML = options.title;
            toast.appendChild(h4);
        }

        // text
        if (options.text)
        {
            var p = document.createElement('p');
            p.className = 'toasts-text';
            p.innerHTML = options.text;
            toast.appendChild(p);
        }

        // icon
        if (options.icon)
        {
            var img = document.createElement('img');
            img.src = options.icon;
            img.className = 'toasts-icon';
            toast.appendChild(img);
        }

        // click callback
        if (typeof options.callback === 'function')
        {
            toast.addEventListener('click', options.callback);
        }

        // toast api
        toast.hide = function()
        {
            toast.className += ' toasts-fadeOut';
            toast.addEventListener('animationend', removeToast, false);
        };

        // autohide
        if (options.timeout)
        {
            setTimeout(toast.hide, options.timeout);
        }

        if (options.type)
        {
            toast.className += ' toasts-' + options.type;
        }

        toast.addEventListener('click', toast.hide);


        function removeToast()
        {
            document.getElementById('toasts-container').removeChild(toast);
            delete Toasts.toasts[toast.id];  //remove toast from object
        }

        document.getElementById('toasts-container').appendChild(toast);

        //add toast to object so its easily gettable by its id
        Toasts.toasts[toast.id] = toast;

        return toast;
    };

    Toasts.setTimeout = function(toastid, val)
    {
        if (Toasts.toasts[toastid])
        {
            setTimeout(Toasts.toasts[toastid].hide, val);
        }
    };

    ccpwgl_int.logger.on('error', function(e)
    {
        if (!e.hide)
        {
            Toasts.create({
                type: 'error',
                title: e.name,
                text: e.message,
                timeout: 8000,
                icon: 'https://image.eveonline.com/Type/24552_64.png'
            });
        }
    });

    ccpwgl_int.logger.on('warn', function(e)
    {
        if (!e.hide)
        {
            Toasts.create({
                type: 'warning',
                title: e.name,
                text: e.message,
                timeout: 6000,
                icon: 'https://image.eveonline.com/Type/24589_64.png'
            });
        }
    });
}


